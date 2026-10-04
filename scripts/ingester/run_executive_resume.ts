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
            temperature: 0.25
          }
        })
      });

      const data = await res.json();
      if (data.error) {
        console.warn('API Warning:', data.error.message);
        if (data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED') {
          console.log('Waiting 35s for quota reset...');
          await sleep(35000);
          continue;
        }
        if (data.error.code === 500 || data.error.code === 503) {
          console.log('Transient spike. Waiting 8s...');
          await sleep(8000);
          continue;
        }
        throw new Error(data.error.message);
      }

      const candidate = data.candidates?.[0];
      const textPart = candidate?.content?.parts?.find((p: any) => !p.thought)?.text || '';
      return textPart.trim();
    } catch (e: any) {
      console.warn('Exception:', e.message);
      await sleep(8000);
    }
  }
}

async function main() {
  const ingestedContent = fs.readFileSync('scripts/ingester/ingested_repo.md', 'utf8');

  const systemPrompt = `You are a Principal Systems Architect and Executive Tech Resume Writer who has reviewed thousands of Staff/Principal engineer resumes for Google, Meta, Apple, and high-frequency trading firms.

You know that generic or robotic resume bullets (e.g. saying 'as measured by executing test_live.rs' or listing textbook definitions) get rejected immediately.
Instead, a world-class resume project entry must:
1. Instantly hook the recruiter/hiring manager with the sheer technical difficulty and scope of the project (cross-platform low-latency 4K streaming pipeline bridging Android internals with Windows OS video drivers via Rust).
2. Show full-stack systems craftsmanship: real-time camera capture on mobile, custom wire protocols/depacketizers, zero-copy GPU video decoders, and kernel/OS-level virtual camera driver injection.
3. Use powerful, natural engineering language with concrete numbers, architecture choices, and impact (e.g., zero-copy memory transfers, hardware-accelerated Direct3D11/Media Foundation decoding, sub-second latency, robust session healing under hardware disconnects).
4. Strictly ground all facts in the provided repository AST digest without fabricating nonexistent tools.`;

  const userPrompt = `Review this complete codebase digest for the project "AWA (Android Wireless Adapter / Android-cam)":

${ingestedContent}

Generate a comprehensive, standout resume showcase for this project that would blow away any senior hiring manager.

Structure the output into:
1. **Executive Project Header**:
   - Project Name & One-line Punchy Value Prop (what problem it solves and why it's technically impressive)
   - Tech Stack (categorized cleanly: Systems/Rust, Android/Mobile, Video & Media, Networking & Protocols)
   - GitHub Repo / Architecture Tier

2. **Top 4-5 High-Impact Executive Resume Bullets** (formatted ready-to-paste for a top-tier resume):
   - Each bullet must start with a strong action verb (Architected, Engineered, Developed, Implemented, Designed).
   - Each bullet must highlight a major technical pillar of the project:
     * Full-duplex streaming architecture (Android Camera2 + RTSP server to Rust desktop client)
     * Hardware-accelerated decoding & zero-copy GPU pipeline (Windows Media Foundation, Direct3D11, NV12)
     * Custom RTP depacketization & low-latency network transport (FU-A/STAP-A NALU reassembly, TCP socket buffer tuning)
     * OS-level Virtual Camera Driver injection (enabling system-wide use in Zoom, OBS, Teams)
     * Fault-tolerant session management & bi-directional control plane (embedded Ktor WebSocket server, background WakeLock, auto-healing camera watchdog)
   - DO NOT write robotic phrases like "as measured by running test_xyz.rs". Frame it as professional engineering accomplishments.

3. **"Under-the-Hood" Technical Highlights for Interviews**:
   - 3 deep-dive bullet points explaining the hardest technical problems solved in the code (e.g. Annex-B to AVCC bitstream conversion, handling sequence wraparound in RTP fragmentation, Direct3D11 sample locking).

4. **Why This Impresses a Hiring Manager**:
   - A brief 2-3 sentence recruiter assessment of what signals this project sends about the candidate's engineering caliber.`;

  console.log('Sending request to Gemma 4 31B for executive resume overhaul...');
  const start = Date.now();
  const output = await callGemma(systemPrompt, userPrompt);
  console.log(`✓ Completed in ${Date.now() - start}ms (${output.length} characters)`);

  fs.writeFileSync('scripts/ingester/executive_resume_highlight.md', output);
  console.log('Saved to scripts/ingester/executive_resume_highlight.md');
}

main().catch(console.error);
