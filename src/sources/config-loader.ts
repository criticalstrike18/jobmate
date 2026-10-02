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
    },
  };
}