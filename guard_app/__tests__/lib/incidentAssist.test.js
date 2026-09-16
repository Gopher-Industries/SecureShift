/* eslint-env jest */

import { assistIncident as apiAssist, askAssistant } from '../../src/api/aiIncident';
import {
  assistIncident,
  buildStructuredDraft,
  findMissingFields,
  suggestSeverity,
} from '../../src/lib/incidentAssist';

describe('suggestSeverity', () => {
  it('flags violent / dangerous incidents as High', () => {
    expect(suggestSeverity('A man was seen with a knife near the gate')).toBe('High');
    expect(suggestSeverity('There is a fire in the storeroom')).toBe('High');
  });

  it('flags property / disturbance incidents as Medium', () => {
    expect(suggestSeverity('Someone reported a theft of a laptop')).toBe('Medium');
    expect(suggestSeverity('Found graffiti on the wall')).toBe('Medium');
  });

  it('defaults to Low for minor incidents', () => {
    expect(suggestSeverity('The side gate was left open')).toBe('Low');
  });
});

describe('findMissingFields', () => {
  it('returns nothing when all key details are present', () => {
    const text =
      'At 10:30 pm near the main gate, a male suspect tried to enter; I called the police and secured the area.';
    expect(findMissingFields(text)).toEqual([]);
  });

  it('flags all four when the note is bare', () => {
    expect(findMissingFields('Something happened').sort()).toEqual(
      ['action', 'location', 'people', 'time'].sort(),
    );
  });
});

describe('buildStructuredDraft', () => {
  const draft = buildStructuredDraft({
    description: 'At 10pm a man entered. I called police.',
    dateTime: '2026-09-16 22:00',
    location: 'Main gate',
    shiftTitle: 'Night Patrol',
  });

  it('produces a structured report with the provided context', () => {
    expect(draft).toContain('INCIDENT REPORT');
    expect(draft).toContain('Shift: Night Patrol');
    expect(draft).toContain('Date/Time: 2026-09-16 22:00');
    expect(draft).toContain('Location: Main gate');
    expect(draft).toContain('Action taken:');
    expect(draft).toContain('Assessed severity:');
  });

  it('pulls action sentences into the action section', () => {
    expect(draft).toContain('I called police.');
  });
});

describe('assistIncident (aggregate)', () => {
  it('returns draft, severity and missing fields together', () => {
    const r = assistIncident({ description: 'A man had a knife at the gate' });
    expect(r.suggestedSeverity).toBe('High');
    expect(typeof r.draft).toBe('string');
    expect(Array.isArray(r.missing)).toBe(true);
  });
});

describe('aiIncident API (mock mode)', () => {
  it('assistIncident resolves the assist result shape', async () => {
    const r = await apiAssist({ description: 'Theft reported at the car park at 9pm by a guard' });
    expect(r.suggestedSeverity).toBe('Medium');
    expect(r.draft).toContain('INCIDENT REPORT');
  });

  it('askAssistant returns emergency guidance for a fire question', async () => {
    const r = await askAssistant('There is a fire, what do I do?');
    expect(r.answer).toMatch(/000/);
  });
});
