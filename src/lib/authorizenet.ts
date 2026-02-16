/**
 * Authorize.net ARB (Automated Recurring Billing) API client.
 * Uses fetch() against the JSON API directly — no npm dependency.
 */

const API_LOGIN_ID = process.env.AUTHORIZE_NET_LOGIN_ID_PROD ?? "";
const TRANSACTION_KEY = process.env.AUTHORIZE_NET_TRANSACTION_KEY_PROD ?? "";

const ENDPOINT = "https://api.authorize.net/xml/v1/request.api";

function merchantAuth() {
  return { name: API_LOGIN_ID, transactionKey: TRANSACTION_KEY };
}

async function apiCall(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Authorize.net returns a BOM-prefixed JSON response
  const text = await res.text();
  const cleaned = text.replace(/^\uFEFF/, "");
  return JSON.parse(cleaned);
}

export interface SubscriptionDetail {
  arbSubscriptionId: string;
  name: string | null;
  status: string;
  amount: string | null;
  billingEmail: string | null;
}

/**
 * Get all active subscription IDs from Authorize.net ARB.
 * Handles pagination (1000 per page).
 */
export async function getActiveSubscriptionIds(): Promise<string[]> {
  const ids: string[] = [];
  let offset = 1;
  const limit = 1000;

  while (true) {
    const response = (await apiCall({
      ARBGetSubscriptionListRequest: {
        merchantAuthentication: merchantAuth(),
        searchType: "subscriptionActive",
        sorting: { orderBy: "id", orderDescending: false },
        paging: { limit, offset },
      },
    })) as {
      totalNumInResultSet?: number;
      subscriptionDetails?: Array<{ id: number }>;
      messages?: { resultCode: string };
    };

    const subs = response.subscriptionDetails ?? [];
    for (const sub of subs) {
      ids.push(String(sub.id));
    }

    const total = response.totalNumInResultSet ?? 0;
    if (offset + limit > total || subs.length === 0) break;
    offset += limit;
  }

  return ids;
}

/**
 * Get detail for a single subscription.
 */
export async function getSubscriptionDetail(
  subscriptionId: string
): Promise<SubscriptionDetail> {
  const response = (await apiCall({
    ARBGetSubscriptionRequest: {
      merchantAuthentication: merchantAuth(),
      subscriptionId,
    },
  })) as {
    subscription?: {
      name?: string;
      status?: string;
      amount?: number;
      profile?: {
        paymentProfile?: {
          billTo?: { email?: string };
        };
      };
    };
  };

  const sub = response.subscription ?? {};
  return {
    arbSubscriptionId: subscriptionId,
    name: sub.name ?? null,
    status: sub.status ?? "active",
    amount: sub.amount != null ? String(sub.amount) : null,
    billingEmail:
      sub.profile?.paymentProfile?.billTo?.email ?? null,
  };
}

/**
 * Fetch subscription details in parallel with chunked concurrency.
 */
export async function getSubscriptionDetailsBatch(
  ids: string[],
  concurrency = 5
): Promise<SubscriptionDetail[]> {
  const results: SubscriptionDetail[] = [];

  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const batch = await Promise.all(
      chunk.map((id) => getSubscriptionDetail(id))
    );
    results.push(...batch);
  }

  return results;
}
