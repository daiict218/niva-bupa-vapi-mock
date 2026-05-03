// Vercel serverless function: policy lookup by customer id.
// Accepts Vapi's tool-call envelope or a plain JSON body.

const MOCK_POLICIES = {
  'NB-784521': {
    policy_number: 'NB-HEALTH-2026-78451',
    plan_name: 'ReAssure 2.0',
    policy_start_date: '2026-04-28',
    sum_insured: 1500000,
    coverage_type: 'Family Floater',
    primary_member_count: 4,
    member_names: ['Ajay Gaur', 'Pooja Gaur', 'Krishan Gaur', 'Krishna Gaur'],
    network_hospitals_url: 'https://www.nivabupa.com/network-hospitals',
    relationship_manager_name: 'Anita Mehta',
    relationship_manager_phone: '1860-500-8888',
    policy_document_url: 'https://nivabupa-mock.example/docs/NB-HEALTH-2026-78451.pdf',
  },
  'NB-784522': {
    policy_number: 'NB-HEALTH-2026-78452',
    plan_name: 'Health Plus',
    policy_start_date: '2026-04-29',
    sum_insured: 500000,
    coverage_type: 'Individual',
    primary_member_count: 1,
    member_names: ['Priya Sharma'],
    network_hospitals_url: 'https://www.nivabupa.com/network-hospitals',
    relationship_manager_name: 'Vikram Iyer',
    relationship_manager_phone: '1860-500-8888',
    policy_document_url: 'https://nivabupa-mock.example/docs/NB-HEALTH-2026-78452.pdf',
  },
};

const DEFAULT_CUSTOMER_ID = 'NB-784521';

function lookupPolicy(customerId) {
  if (customerId && MOCK_POLICIES[customerId]) {
    return MOCK_POLICIES[customerId];
  }
  return MOCK_POLICIES[DEFAULT_CUSTOMER_ID];
}

function extractInput(body) {
  if (!body || typeof body !== 'object') return { customerId: null, toolCallId: null };

  const toolCall =
    body?.message?.toolCallList?.[0] ??
    body?.message?.toolCalls?.[0] ??
    null;

  if (toolCall) {
    let args = toolCall.function?.arguments ?? toolCall.arguments ?? {};
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch { args = {}; }
    }
    return { customerId: args.customer_id, toolCallId: toolCall.id ?? null };
  }

  return { customerId: body.customer_id, toolCallId: null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      tool: 'get_policy_details',
      usage: 'POST { "customer_id": "NB-784521" }',
      seeded_customer_ids: Object.keys(MOCK_POLICIES),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { customerId, toolCallId } = extractInput(req.body);
  const policy = lookupPolicy(customerId);

  if (toolCallId) {
    return res.status(200).json({
      results: [
        { toolCallId, result: JSON.stringify(policy) },
      ],
    });
  }

  return res.status(200).json(policy);
}
