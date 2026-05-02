// Vercel serverless function: schedule a callback with a human advisor.
// Accepts Vapi's tool-call envelope or a plain JSON body.

const ADVISOR_POOL = [
  { advisor_id: 'NB-ADV-014', advisor_name: 'Anita Mehta' },
  { advisor_id: 'NB-ADV-027', advisor_name: 'Vikram Iyer' },
  { advisor_id: 'NB-ADV-033', advisor_name: 'Sneha Reddy' },
];

function pickAdvisor(customerId) {
  if (!customerId) return ADVISOR_POOL[0];
  let hash = 0;
  for (let i = 0; i < customerId.length; i++) {
    hash = (hash * 31 + customerId.charCodeAt(i)) >>> 0;
  }
  return ADVISOR_POOL[hash % ADVISOR_POOL.length];
}

function makeConfirmationId(customerId) {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  const cust = (customerId || 'NB').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase();
  return `CB-${cust}-${suffix}`;
}

function extractInput(body) {
  if (!body || typeof body !== 'object') {
    return { args: {}, toolCallId: null };
  }

  const toolCall =
    body?.message?.toolCallList?.[0] ??
    body?.message?.toolCalls?.[0] ??
    null;

  if (toolCall) {
    let args = toolCall.function?.arguments ?? toolCall.arguments ?? {};
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch { args = {}; }
    }
    return { args, toolCallId: toolCall.id ?? null };
  }

  return { args: body, toolCallId: null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      tool: 'schedule_callback',
      usage: 'POST { "customer_id": "NB-784521", "preferred_date": "2026-05-03", "preferred_time": "14:00", "reason": "policy questions" }',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { args, toolCallId } = extractInput(req.body);
  const advisor = pickAdvisor(args.customer_id);
  const result = {
    confirmation_id: makeConfirmationId(args.customer_id),
    customer_id: args.customer_id || null,
    scheduled_for_date: args.preferred_date || null,
    scheduled_for_time: args.preferred_time || null,
    advisor_id: advisor.advisor_id,
    advisor_name: advisor.advisor_name,
    status: 'scheduled',
  };

  if (toolCallId) {
    return res.status(200).json({
      results: [{ toolCallId, result: JSON.stringify(result) }],
    });
  }

  return res.status(200).json(result);
}
