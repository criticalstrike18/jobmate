import fs from 'node:fs';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB9c18LEJJ7lemV5taGoofAsmUvLRDkioQ';
const MODEL = 'models/gemma-4-31b-it';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemma(systemInstruction: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`;
  
  while (true) {
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
        console.warn('API Response Warning:', data.error.message);
        if (data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED') {
          console.log('Waiting 40s for quota window to reset...');
          await sleep(40000);
          continue;
        }
        if (data.error.code === 503 || data.error.code === 500) {
          console.log('Transient upstream spike. Waiting 10s...');
          await sleep(10000);
          continue;
        }
        throw new Error(data.error.message);
      }

      const candidate = data.candidates?.[0];
      const textPart = candidate?.content?.parts?.find((p: any) => !p.thought)?.text || '';
      return textPart.trim();
    } catch (e: any) {
      console.warn('Network exception:', e.message);
      await sleep(10000);
    }
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync('scripts/ingester/ingest_test_results.json', 'utf8'));
  const ingestedContent = fs.readFileSync('scripts/ingester/ingested_repo.md', 'utf8');

  const networkingPrompt = data.generated_prompts.networking_prompt;
  console.log('Running final Networking Only angle with Gemma 4 31B...');
  const start = Date.now();
  const output = await callGemma(
    'You are a senior technical resume architect. Ground every single claim in the provided repository digest. Do not hallucinate tools or frameworks not present in the files.',
    `${networkingPrompt}\n\nHere is the complete codebase digest extracted by the Go Ingest tool:\n\n${ingestedContent}`
  );
  const duration = Date.now() - start;

  console.log(`✓ Completed Networking Only in ${duration}ms (${output.length} characters)`);
  data.results[2] = {
    angle: 'Networking Only',
    prompt: networkingPrompt,
    output,
    duration
  };

  fs.writeFileSync('scripts/ingester/ingest_test_results.json', JSON.stringify(data, null, 2));
  console.log('✓ Successfully updated scripts/ingester/ingest_test_results.json with all 3 complete angles!');
}

main().catch(console.error);
