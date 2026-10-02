import type { SourceId, TrustTier } from './types.js';

export interface AtsBoard {
  ats: 'greenhouse' | 'lever' | 'ashby';
  token: string;
  label?: string;
}

export interface FeedConfig {
  enabled: boolean;
  trustTier: TrustTier;
}

export interface SourceConfig {
  boards: AtsBoard[];
  feeds: {
    arbeitnow: FeedConfig;
    arbeitnowUk: FeedConfig;
    remotive: FeedConfig;
  };
}

export interface ResolvedBoard {
  id: SourceId;
  ats: AtsBoard['ats'];
  token: string;
  label: string;
}

const ATS_HOST: Record<AtsBoard['ats'], string> = {
  greenhouse: 'boards.greenhouse.io',
  lever: 'jobs.lever.co',
  ashby: 'jobs.ashbyhq.com',
};

export function boardId(board: AtsBoard): SourceId {
  return `${board.ats}:${board.token}`;
}

export function boardHost(board: AtsBoard): string {
  return ATS_HOST[board.ats];
}

export function boardDomain(board: AtsBoard): string {
  return ATS_HOST[board.ats];
}

export function resolveBoards(config: SourceConfig): ResolvedBoard[] {
  return config.boards.map((b) => ({
    id: boardId(b),
    ats: b.ats,
    token: b.token,
    label: b.label ?? `${b.ats}/${b.token}`,
  }));
}