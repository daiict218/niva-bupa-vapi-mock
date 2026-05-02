# Niva Bupa Vapi Mock

Two mock HTTP endpoints used by a Vapi-driven Outbound AI agent demo (Niva Bupa welcome calling). Both endpoints accept Vapi's tool-call envelope or a plain JSON body, and return synthetic data.

All data is fabricated for demo purposes. There is no real customer information in this repo.

## Endpoints

| Endpoint | Purpose | Body |
|---|---|---|
| POST `/api/get-customer-profile` | Identity lookup by phone number | `{ "phone_number": "+919876543210" }` |
| POST `/api/get-policy-details` | Policy lookup by customer id | `{ "customer_id": "NB-784521" }` |
| POST `/api/schedule-callback` | Schedule callback with human advisor | `{ "customer_id": "NB-784521", "preferred_date": "2026-05-03", "preferred_time": "14:00", "reason": "policy details" }` |

Both endpoints also respond to GET (returns a usage hint, useful for sanity-checking the deploy).

## Mocked records

Two policyholders are seeded for demo variety. Any phone or customer id not in the table falls back to the first record so demos do not break on a typo.

| Phone | Customer id | Name | Plan |
|---|---|---|---|
| +919876543210 | NB-784521 | Rajesh Kumar | ReAssure 2.0 - Family Floater (15 lakh) |
| +919876543211 | NB-784522 | Priya Sharma | Health Plus - Individual (5 lakh) |

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Go to vercel.com, log in, click "Add New Project".
3. Import the GitHub repo. Vercel auto-detects the `api/` folder as serverless functions; no build step needed.
4. Click Deploy. Vercel returns a URL like `https://niva-bupa-vapi-mock.vercel.app`.
5. Test by hitting the GET form in a browser:
   - `https://YOUR-PROJECT.vercel.app/api/get-customer-profile`
   - `https://YOUR-PROJECT.vercel.app/api/get-policy-details`

## Wire into Vapi

In Vapi's tool configuration, add two custom function tools:

### Tool 1: `get_customer_profile`

- Name: `get_customer_profile`
- Description: "Look up a customer's identity, date of birth, address, and language preference using their phone number. Always call this first before greeting the caller by name."
- Server URL: `https://YOUR-PROJECT.vercel.app/api/get-customer-profile`
- Parameters:
  ```json
  {
    "type": "object",
    "properties": {
      "phone_number": {
        "type": "string",
        "description": "E.164-format phone number, e.g. +919876543210"
      }
    },
    "required": ["phone_number"]
  }
  ```

### Tool 2: `get_policy_details`

- Name: `get_policy_details`
- Description: "Fetch the customer's active health insurance policy: plan name, sum insured, start date, and policy document URL. Call after `get_customer_profile` returns a `customer_id`."
- Server URL: `https://YOUR-PROJECT.vercel.app/api/get-policy-details`
- Parameters:
  ```json
  {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Customer id from get_customer_profile, e.g. NB-784521"
      }
    },
    "required": ["customer_id"]
  }
  ```

### Tool 3: `schedule_callback`

- Name: `schedule_callback`
- Description: "Schedule a callback with a human Niva Bupa advisor. Use whenever the customer asks a question outside the welcome-call scope (claims, hospital network, sub-limits, room rent, waiting period, exclusions) OR explicitly asks for a callback. Returns a confirmation_id and the advisor name."
- Server URL: `https://YOUR-PROJECT.vercel.app/api/schedule-callback`
- Parameters:
  ```json
  {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Customer id from get_customer_profile, e.g. NB-784521"
      },
      "preferred_date": {
        "type": "string",
        "description": "ISO date YYYY-MM-DD"
      },
      "preferred_time": {
        "type": "string",
        "description": "24-hour time HH:MM"
      },
      "reason": {
        "type": "string",
        "description": "Short tag: policy details, claim process, hospital network, etc."
      }
    },
    "required": ["customer_id", "preferred_date", "preferred_time"]
  }
  ```

## Local testing

The endpoints have no dependencies. To test without deploying:

```bash
# Use Node's built-in test or just curl after `vercel dev` (requires Vercel CLI):
npm install -g vercel
vercel dev
# then:
curl -X POST http://localhost:3000/api/get-customer-profile \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+919876543210"}'
```

## What this is not

- Not authenticated. Anyone can hit these endpoints and get the mock data.
- Not connected to the real Sprinklr CRM or any real Niva Bupa system.
- Not for production use. Demo scaffold only.
