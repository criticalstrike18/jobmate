import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import type { SourceConfig } from './config.js';

const DEFAULT_PATH = 'config/sources.yaml';

export async function loadSourceConfig(path = process.env.JOBMATE_SOURCES ?? DEFAULT_PATH): Promise<SourceConfig> {
  const text = await readFile(path, 'utf8');
  const config = parse(text) as Partial<SourceConfig>;

  if (!Array.isArray(config.boards)) {
    throw new Error(`${path}: missing "boards" array`);
  }

  return {
    boards: config.boards,
    feeds: {
      arbeitnow: config.feeds?.arbeitnow ?? { enabled: true, trustTier: 'aggregator' },
      arbeitnowUk: config.feeds?.arbeitnowUk ?? { enabled: false, trustTier: 'aggregator' },
      remotive: config.feeds?.remotive ?? { enabled: true, trustTier: 'rss' },
      himalayas: config.feeds?.himalayas ?? { enabled: true, trustTier: 'aggregator' },
      remoteok: config.feeds?.remoteok ?? { enabled: true, trustTier: 'aggregator' },
      jobicy: config.feeds?.jobicy ?? { enabled: true, trustTier: 'aggregator' },
      hn: config.feeds?.hn ?? { enabled: true, trustTier: 'community' },
    },
    serp: {
      serpapi: config.serp?.serpapi ?? { enabled: false },
      jsearch: config.serp?.jsearch ?? { enabled: false },
    },
  };
}