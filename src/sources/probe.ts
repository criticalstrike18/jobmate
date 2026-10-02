import { fetchAshby } from './ashby.js';
import { resolveBoards, type ResolvedBoard } from './config.js';
import { fetchGreenhouse } from './greenhouse.js';
import { fetchLever } from './lever.js';

export interface ProbeOk {
  board: ResolvedBoard;
  ok: true;
  count: number;
  sample?: string;
  ms: number;
}

export interface ProbeFail {
  board: ResolvedBoard;
  ok: false;
  error: string;
  ms: number;
}

export async function probeBoard(board: ResolvedBoard): Promise<ProbeOk | ProbeFail> {
  const start = Date.now();

  try {
    const jobs =
      board.ats === 'greenhouse'
        ? await fetchGreenhouse(board)
        : board.ats === 'lever'
          ? await fetchLever(board)
          : await fetchAshby(board);

    return {
      board,
      ok: true,
      count: jobs.length,
      sample: jobs[0]?.title,
      ms: Date.now() - start,
    };
  } catch (err) {
    return {
      board,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    };
  }
}

export { resolveBoards };
export type { ResolvedBoard };