import fs from 'node:fs';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB9c18LEJJ7lemV5taGoofAsmUvLRDkioQ';
const MODEL = 'models/gemma-4-31b-it';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemma(systemInstruction: string, userPrompt: string, maxRetries = 4): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        })
      });

      const data = await res.json();
      if (data.error) {
        console.warn(`[Attempt ${attempt}/${maxRetries}] API Warning/Error:`, data.error.message);
        if (data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED') {
          console.log('Quota rate limit reached. Waiting 35s for quota window to reset...');
          await sleep(35000);
          continue;
        }
        if (data.error.code === 500) {
          console.log('Internal transient error. Waiting 6s before retry...');
          await sleep(6000);
          continue;
        }
        if (attempt < maxRetries) {
          await sleep(5000);
          continue;
        }
        throw new Error(data.error.message);
      }

      const candidate = data.candidates?.[0];
      const textPart = candidate?.content?.parts?.find((p: any) => !p.thought)?.text || '';
      return textPart.trim();
    } catch (e: any) {
      console.warn(`[Attempt ${attempt}] Exception caught:`, e.message);
      if (attempt < maxRetries) {
        await sleep(10000);
        continue;
      }
      throw e;
    }
  }
  return '';
}

async function main() {
  console.log('=====================================================');
  console.log('STEP 1: Getting 3 Specialized Prompts with Gemma 4 31B');
  console.log('=====================================================');

  const metaPrompt = `You are a principal technical recruiter and resume architect.
We need to evaluate a candidate's codebase from 3 distinct, highly specialized job angles:
1. "Android Only": Focuses strictly on mobile engineering, Android Camera2/MediaCodec, Ktor embedded server, Jetpack Compose, thermal/battery optimizations, and mobile lifecycle.
2. "Rust Only": Focuses strictly on systems programming, Rust egui/eframe GUI, zero-copy NV12 video decoding, Windows DirectShow/Media Foundation virtual camera integration, lock-free concurrency, and memory safety.
3. "Networking Only": Focuses strictly on real-time networking protocols, RTSP packet depacketization, WebSockets control plane, concurrent RPC/mutex synchronization, network jitter/fps probes, and client-server state sync.

Generate 3 detailed, professional prompt templates. Each prompt must:
- Instruct the resume writer to inspect the provided repository code AST, package manifests, and tree.
- Extract only engineering facts relevant to that specific domain.
- Format the output into:
  - Project Title & Domain Headline
  - 3-4 High-impact Google XYZ bullet points ("Accomplished [X] measured by [Y] by doing [Z]")
  - Exact Tech Stack list
  - "Key Codebase Proofs" citing specific files, structs, or functions found in the repo.

Format your response as a valid JSON object with keys:
"android_prompt", "rust_prompt", "networking_prompt"`;

  console.log('Querying Gemma 4 31B for prompt generation...');
  const promptGenResponse = await callGemma(
    'You are an expert prompt engineer. Return ONLY raw JSON without markdown code fences.',
    metaPrompt
  );

  let cleanJson = promptGenResponse;
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  let generatedPrompts: { android_prompt: string; rust_prompt: string; networking_prompt: string };
  try {
    generatedPrompts = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('Fallback regex JSON parse...');
    const androidMatch = cleanJson.match(/"android_prompt"\s*:\s*"([\s\S]*?)(?=",\s*"rust_prompt")/);
    const rustMatch = cleanJson.match(/"rust_prompt"\s*:\s*"([\s\S]*?)(?=",\s*"networking_prompt")/);
    const netMatch = cleanJson.match(/"networking_prompt"\s*:\s*"([\s\S]*?)"\s*\}/);

    generatedPrompts = {
      android_prompt: androidMatch ? androidMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Focus strictly on Android, Camera2, Ktor, Compose, and mobile lifecycle.',
      rust_prompt: rustMatch ? rustMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Focus strictly on Rust, egui, DirectShow, Media Foundation, and zero-copy NV12 decoding.',
      networking_prompt: netMatch ? netMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Focus strictly on RTSP streaming, WebSockets, network depacketizer, and client-server sync.'
    };
  }

  console.log('✓ Successfully generated 3 prompts via Gemma 4 31B:');
  console.log('- Android Prompt preview:', generatedPrompts.android_prompt.slice(0, 100) + '...');
  console.log('- Rust Prompt preview:', generatedPrompts.rust_prompt.slice(0, 100) + '...');
  console.log('- Networking Prompt preview:', generatedPrompts.networking_prompt.slice(0, 100) + '...');

  console.log('\nWaiting 32s for quota window to refresh before starting evaluations...');
  await sleep(32000);

  console.log('\n=====================================================');
  console.log('STEP 2: Ingest Codebase Context from Go Ingester');
  console.log('=====================================================');

  const ingestedPath = 'scripts/ingester/ingested_repo.md';
  const ingestedContent = fs.readFileSync(ingestedPath, 'utf8');
  console.log(`Loaded ingested codebase context: ${ingestedContent.length} chars (~${Math.round(ingestedContent.length / 4)} tokens)`);

  const tests = [
    { name: 'Android Only', prompt: generatedPrompts.android_prompt },
    { name: 'Rust Only', prompt: generatedPrompts.rust_prompt },
    { name: 'Networking Only', prompt: generatedPrompts.networking_prompt }
  ];

  const results: any[] = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    console.log(`\n-----------------------------------------------------`);
    console.log(`[${i + 1}/3] Running Angle: ${t.name} with Gemma 4 31B...`);
    console.log(`-----------------------------------------------------`);

    const userQuery = `${t.prompt}\n\nHere is the complete codebase digest extracted by the Go Ingest tool:\n\n${ingestedContent}`;
    const start = Date.now();
    const output = await callGemma(
      'You are a senior technical resume architect. Ground every single claim in the provided repository digest. Do not hallucinate tools or frameworks not present in the files.',
      userQuery
    );
    const duration = Date.now() - start;

    console.log(`✓ Completed in ${duration}ms (${output.length} characters)`);
    results.push({
      angle: t.name,
      prompt: t.prompt,
      output,
      duration
    });

    if (i < tests.length - 1) {
      console.log('Cooldown: Waiting 35s to respect the 16,000 input tokens/min quota...');
      await sleep(35000);
    }
  }

  const finalPayload = {
    generated_prompts: generatedPrompts,
    results
  };

  fs.writeFileSync('scripts/ingester/ingest_test_results.json', JSON.stringify(finalPayload, null, 2));
  console.log('\n=====================================================');
  console.log('✓ All 3 angles completed! Results saved to scripts/ingester/ingest_test_results.json');
  console.log('=====================================================');
}

main().catch(console.error);
