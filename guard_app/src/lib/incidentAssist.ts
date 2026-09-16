// Pure helpers behind the AI Incident Assistant (GA-045). No side effects, so
// they are easy to unit test and are also used as the deterministic fallback
// when the AI backend isn't available (see api/aiIncident.ts).

export type Severity = 'Low' | 'Medium' | 'High';
export type MissingField = 'time' | 'location' | 'people' | 'action';

export type AssistInput = {
  description: string;
  dateTime?: string;
  location?: string;
  shiftTitle?: string;
};

export type AssistResult = {
  draft: string;
  suggestedSeverity: Severity;
  missing: MissingField[];
};

const HIGH_TERMS = [
  'weapon',
  'gun',
  'knife',
  'firearm',
  'fire',
  'smoke',
  'blood',
  'injur',
  'assault',
  'attack',
  'threat',
  'ambulance',
  'unconscious',
  'break-in',
  'break in',
  'intruder',
  'violence',
  'fight',
  'stab',
  'gunshot',
  'bomb',
  'explos',
  'overdose',
  'collapse',
];
const MEDIUM_TERMS = [
  'theft',
  'stolen',
  'steal',
  'trespass',
  'damage',
  'vandal',
  'suspicious',
  'intoxicat',
  'drunk',
  'argument',
  'dispute',
  'graffiti',
  'forced',
  'broke in',
  'harass',
  'altercation',
];

function has(text: string, terms: string[]): boolean {
  const t = text.toLowerCase();
  return terms.some((term) => t.includes(term));
}

// Heuristic severity from the description text.
export function suggestSeverity(text: string): Severity {
  if (has(text, HIGH_TERMS)) return 'High';
  if (has(text, MEDIUM_TERMS)) return 'Medium';
  return 'Low';
}

const TIME_RE =
  /\b(\d{1,2}[:.]\d{2}\s*(am|pm)?|\d{1,2}\s*(am|pm)|morning|afternoon|evening|night|midnight|noon|o'?clock|hours?)\b/i;
const LOCATION_RE =
  /\b(at|near|entrance|gate|door|floor|level|car\s?park|room|lobby|exit|warehouse|building|zone|area|street|corridor|reception|loading dock|perimeter|carpark)\b/i;
const PEOPLE_RE =
  /\b(person|people|man|woman|male|female|individual|suspect|guard|staff|employee|visitor|customer|driver|witness|someone|group|offender|patron)\b/i;
const ACTION_RE =
  /\b(called|contacted|reported|notified|escorted|removed|detained|secured|locked|responded|assisted|administered|evacuat|police|ambulance|manager|first aid|intervened|dispersed|monitored|observed)\b/i;

// Which key details the description appears to be missing.
export function findMissingFields(text: string): MissingField[] {
  const missing: MissingField[] = [];
  if (!TIME_RE.test(text)) missing.push('time');
  if (!LOCATION_RE.test(text)) missing.push('location');
  if (!PEOPLE_RE.test(text)) missing.push('people');
  if (!ACTION_RE.test(text)) missing.push('action');
  return missing;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tidy(sentence: string): string {
  const s = sentence.trim().replace(/\s+/g, ' ');
  if (!s) return s;
  const capped = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

// Build a clean, structured incident report from the raw notes. Deterministic:
// it reorganises and tidies the guard's own words rather than inventing facts.
export function buildStructuredDraft(input: AssistInput): string {
  const { description, dateTime, location, shiftTitle } = input;
  const sentences = splitSentences(description);
  const summary = sentences.length ? sentences.map(tidy).join(' ') : 'To be confirmed.';
  const actionSentences = sentences.filter((s) => ACTION_RE.test(s)).map(tidy);
  const action = actionSentences.length ? actionSentences.join(' ') : 'To be confirmed.';
  const severity = suggestSeverity(description);

  const lines = [
    'INCIDENT REPORT',
    shiftTitle ? `Shift: ${shiftTitle}` : null,
    `Date/Time: ${dateTime ?? 'To be confirmed'}`,
    `Location: ${location ?? 'To be confirmed'}`,
    '',
    'Summary of incident:',
    summary,
    '',
    'Action taken:',
    action,
    '',
    `Assessed severity: ${severity}`,
  ].filter((l) => l !== null);

  return lines.join('\n');
}

export function assistIncident(input: AssistInput): AssistResult {
  return {
    draft: buildStructuredDraft(input),
    suggestedSeverity: suggestSeverity(input.description),
    missing: findMissingFields(input.description),
  };
}
