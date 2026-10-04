import fs from 'node:fs';

const API_KEY = process.env.GEMINI_API_KEY || '';
const MODELS = ['models/gemma-4-26b-a4b-it', 'models/gemma-4-31b-it'];

async function fetchRepoData() {
  const [repoRes, langsRes, readmeRes] = await Promise.all([
    fetch('https://api.github.com/repos/criticalstrike18/Android-cam', { headers: { 'User-Agent': 'JobMate-Test' } }),
    fetch('https://api.github.com/repos/criticalstrike18/Android-cam/languages', { headers: { 'User-Agent': 'JobMate-Test' } }),
    fetch('https://api.github.com/repos/criticalstrike18/Android-cam/readme', {
      headers: { 'User-Agent': 'JobMate-Test', Accept: 'application/vnd.github.raw+json' }
    })
  ]);

  const repo = await repoRes.json();
  const langs = await langsRes.json();
  const readme = await readmeRes.text();

  return {
    name: repo.name,
    languages: langs,
    readme: readme
  };
}

const ANGLES = [
  {
    name: 'Rust Systems Engineer',
    targetJob: 'Senior Systems Engineer (Rust / C++). Requirements: Systems-level programming, zero-copy memory buffers, low-latency video decoding (H.264/NV12), native GUI (egui/eframe), Windows DirectShow/virtual camera drivers, multithreading, and lock-free telemetry.'
  },
  {
    name: 'Android / Camera & Video Optimization Engineer',
    targetJob: 'Senior Android Camera/Media Engineer. Requirements: Deep experience with Android Camera2 API, hardware-accelerated MediaCodec, offscreen EGL/OpenGL rendering, mobile thermal & battery optimization, zero-latency frame pipelines, and handling dynamic orientation changes.'
  },
  {
    name: 'Backend / Streaming Protocol & Distributed Systems',
    targetJob: 'Backend / Network Systems Engineer. Requirements: Real-time network protocols (RTSP, WebSockets, HTTP REST), streaming pipelines, serialized state machines, concurrent RPC synchronization, and robust client-server communications.'
  }
];

function buildPrompt(angle: typeof ANGLES[0], repo: any) {
  return `You are an expert technical resume architect.

Given the following real GitHub repository metadata and README, extract and frame a high-impact, professional resume project entry tailored specifically for a target job.

Target Job Requirements:
${angle.targetJob}

Repository Name: ${repo.name}
Language Distribution: ${JSON.stringify(repo.languages)}
Repository Details:
${repo.readme.slice(0, 3500)}

Instructions:
1. Provide a project title and concise 1-sentence headline tailored to the target job angle.
2. Provide 3-4 bullet points in Google XYZ format ("Accomplished [X] as measured by [Y], by doing [Z]").
3. Focus strictly on real engineering accomplishments described in the repo that align with the target job. Do NOT invent technologies not mentioned.
4. List the exact matching Tech Stack tags.
5. Keep the tone technical, precise, and metric-grounded.`;
}

async function callModel(model: string, prompt: string, retries = 3): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${API_KEY}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2
          }
        })
      });
      const data = await res.json();
      const elapsed = Date.now() - start;

      if (data.error) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        return { error: data.error.message, elapsed };
      }

      const candidate = data.candidates?.[0];
      const thoughtPart = candidate?.content?.parts?.find((p: any) => p.thought)?.text || '';
      const textPart = candidate?.content?.parts?.find((p: any) => !p.thought)?.text || '';
      const usage = data.usageMetadata;

      return {
        text: textPart,
        thought: thoughtPart,
        elapsed,
        usage
      };
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return { error: err.message, elapsed: Date.now() - start };
    }
  }
}

async function main() {
  console.log('Fetching repo data for Android-cam...');
  const repo = await fetchRepoData();
  console.log(`Fetched repo: ${repo.name}, languages: ${Object.keys(repo.languages).join(', ')}`);

  const results: any[] = [];

  for (const angle of ANGLES) {
    console.log(`\n========================================`);
    console.log(`TESTING ANGLE: ${angle.name}`);
    console.log(`========================================`);

    const prompt = buildPrompt(angle, repo);

    for (const model of MODELS) {
      console.log(`Running ${model}...`);
      const res = await callModel(model, prompt);
      results.push({
        angle: angle.name,
        model,
        ...res
      });
      console.log(`Completed ${model} in ${res.elapsed}ms. Output length: ${res.text?.length || 0}`);
    }
  }

  fs.writeFileSync('scripts/test-flight-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults written to scripts/test-flight-results.json');
}

main().catch(console.error);
