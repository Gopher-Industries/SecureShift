// AI Incident Assistant API client (GA-045, app-side).
//
// Defines the contract the backend is expected to implement and falls back to a
// deterministic dev mock (built on lib/incidentAssist) so the feature is fully
// demoable now. Set EXPO_PUBLIC_AI_API=live to call the real endpoints.
//
// Expected backend contract (v1):
//   POST /api/v1/ai/incident/assist
//        body: { description, dateTime?, shiftTitle? }
//        -> { draft, suggestedSeverity, missing }
//   POST /api/v1/ai/incident/ask   (or reuse POST /api/v1/ai/chat)
//        body: { question }
//        -> { answer, sources? }
//
// NOTE for BE: the existing /ai/chat is restricted to employer/admin and is a
// docs-RAG endpoint. The guard incident assistant needs a guard-accessible
// endpoint (or /ai/chat opened to the guard role).
import axios from 'axios';

import http from '../lib/http';
import {
  assistIncident as computeAssist,
  type AssistInput,
  type AssistResult,
  type Severity,
} from '../lib/incidentAssist';

export type { AssistInput, AssistResult, Severity };

export type AiSource = { id: string; document?: string; section?: string };
export type AiAnswer = { answer: string; sources?: AiSource[] };

const USE_MOCK = process.env.EXPO_PUBLIC_AI_API !== 'live';

// ---- Draft & structure + severity + completeness ----------------------------
export async function assistIncident(input: AssistInput): Promise<AssistResult> {
  if (USE_MOCK) return computeAssist(input);

  try {
    const { data } = await http.post<AssistResult>('/ai/incident/assist', {
      description: input.description,
      dateTime: input.dateTime,
      shiftTitle: input.shiftTitle,
    });
    // Defensive: if the backend omits any field, fill from the local computation.
    const local = computeAssist(input);
    return {
      draft: data?.draft ?? local.draft,
      suggestedSeverity: data?.suggestedSeverity ?? local.suggestedSeverity,
      missing: data?.missing ?? local.missing,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && [404, 501].includes(error.response?.status ?? 0)) {
      return computeAssist(input);
    }
    throw error;
  }
}

// ---- Q&A procedure help -----------------------------------------------------
const DISCLAIMER =
  'This is general guidance — always follow your site procedures and call 000 in an emergency.';

function mockAnswer(question: string): AiAnswer {
  const q = question.toLowerCase();
  let body: string;
  if (/(fire|smoke|burning)/.test(q)) {
    body =
      'Raise the alarm and call 000. Evacuate people via the nearest safe exit to the assembly point, do not use lifts, and only tackle a fire if it is small and safe to do so.';
  } else if (/(injur|medical|ambulance|unconscious|bleed|collapse|hurt)/.test(q)) {
    body =
      'Call 000 for a medical emergency. Do not move the person unless they are in danger, apply first aid within your training, and keep them calm until help arrives.';
  } else if (/(theft|stolen|steal|robber)/.test(q)) {
    body =
      'Do not put yourself at risk. Secure the area, preserve any evidence and CCTV, note descriptions and times, and report to your supervisor and police.';
  } else if (/(suspicious|trespass|intruder|unauthor)/.test(q)) {
    body =
      'Observe from a safe distance, do not approach alone, note a description and direction of travel, and report immediately to your supervisor and monitoring centre.';
  } else if (/(aggress|violen|fight|assault|threat|weapon)/.test(q)) {
    body =
      'Prioritise your safety and that of others. Keep your distance, call 000 if there is a weapon or violence, and do not intervene physically — withdraw and report.';
  } else {
    body =
      'Stay calm and ensure your own safety first. Record what happened with times, location and people involved, take photos if safe, and escalate to your supervisor.';
  }
  return { answer: `${body}\n\n${DISCLAIMER}` };
}

export async function askAssistant(question: string): Promise<AiAnswer> {
  if (USE_MOCK) return mockAnswer(question);

  // Live: reuse the existing chat endpoint shape { success, mode, answer, sources }.
  const { data } = await http.post<{ answer?: string; sources?: AiSource[] }>('/ai/chat', {
    question,
  });
  return { answer: data?.answer ?? '', sources: data?.sources };
}
