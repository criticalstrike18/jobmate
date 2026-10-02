export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
  raw?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: 'USD',
  '£': 'GBP',
  '€': 'EUR',
  '₹': 'INR',
  '¥': 'JPY',
  '₽': 'RUB',
  '₺': 'TRY',
  'C$': 'CAD',
  'A$': 'AUD',
};

const UNIT_MULTIPLIER: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
};

function normalize(raw: string): { currency?: string; body: string } {
  const trimmed = raw.trim();
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (trimmed.includes(symbol)) return { currency: code, body: trimmed.replaceAll(symbol, ' ') };
  }
  const iso = trimmed.match(/\b(USD|GBP|EUR|INR|JPY|CAD|AUD|CHF|SEK|NOK|DKK|PLN|BRL|MXN)\b/i);
  if (iso?.[1]) return { currency: iso[1].toUpperCase(), body: trimmed.replace(iso[0], ' ') };
  return { body: trimmed };
}

function parseAmount(token: string): number | undefined {
  const m = token.match(/(\d[\d,]*)(?:\.(\d+))?\s*([km])?/i);
  if (!m?.[1]) return undefined;

  const base = Number(m[1].replace(/,/g, '')) + (m[2] ? Number(`0.${m[2]}`) : 0);
  const unit = m[3]?.toLowerCase();
  const multiplier = unit ? (UNIT_MULTIPLIER[unit] ?? 1) : 1;

  return base * multiplier;
}

/**
 * Best-effort salary extraction from free-form strings such as
 * "$120k - $160k", "USD 90,000 annually", "€50.000 - €60.000".
 * Returns undefined when no plausible amount is present.
 */
export function parseSalary(raw: string | undefined | null): Salary | undefined {
  if (!raw) return undefined;

  const { currency, body } = normalize(raw);
  const numbers: number[] = [];

  for (const token of body.match(/[\d][\d,.]*\s*[km]?/gi) ?? []) {
    const value = parseAmount(token);
    if (value !== undefined && value > 0) numbers.push(value);
  }

  if (numbers.length === 0) return undefined;

  const first = numbers[0]!;
  const second = numbers.length > 1 ? numbers[1]! : first;

  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
    currency,
    raw: raw.trim(),
  };
}