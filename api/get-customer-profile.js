// Vercel serverless function: identity lookup by phone number.
// Accepts Vapi's tool-call envelope or a plain JSON body.

const MOCK_CUSTOMERS = {
  '+919876543210': {
    customer_id: 'NB-784521',
    name: 'Rajesh Kumar',
    date_of_birth: '1985-03-12',
    address_city: 'Mumbai',
    address_pincode: '400028',
    language_preference: 'Hindi',
  },
  '+919876543211': {
    customer_id: 'NB-784522',
    name: 'Priya Sharma',
    date_of_birth: '1990-07-22',
    address_city: 'Bangalore',
    address_pincode: '560001',
    language_preference: 'English',
  },
};

const DEFAULT_PHONE = '+919876543210';

function lookupCustomer(phoneNumber) {
  if (phoneNumber && MOCK_CUSTOMERS[phoneNumber]) {
    return MOCK_CUSTOMERS[phoneNumber];
  }
  return MOCK_CUSTOMERS[DEFAULT_PHONE];
}

function extractInput(body) {
  if (!body || typeof body !== 'object') return { phoneNumber: null, toolCallId: null };

  // Vapi tool-call envelope: message.toolCallList[0] or message.toolCalls[0]
  const toolCall =
    body?.message?.toolCallList?.[0] ??
    body?.message?.toolCalls?.[0] ??
    null;

  if (toolCall) {
    let args = toolCall.function?.arguments ?? toolCall.arguments ?? {};
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch { args = {}; }
    }
    return { phoneNumber: args.phone_number, toolCallId: toolCall.id ?? null };
  }

  // Plain body fallback
  return { phoneNumber: body.phone_number, toolCallId: null };
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
      tool: 'get_customer_profile',
      usage: 'POST { "phone_number": "+919876543210" }',
      seeded_phones: Object.keys(MOCK_CUSTOMERS),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { phoneNumber, toolCallId } = extractInput(req.body);
  const customer = lookupCustomer(phoneNumber);

  if (toolCallId) {
    return res.status(200).json({
      results: [
        { toolCallId, result: JSON.stringify(customer) },
      ],
    });
  }

  return res.status(200).json(customer);
}
