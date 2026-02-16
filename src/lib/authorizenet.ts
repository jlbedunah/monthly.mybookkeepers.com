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
        email?: string;
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
      sub.profile?.email ??
      sub.profile?.paymentProfile?.billTo?.email ??
      null,
  };
}

/**
 * Create an ARB subscription using an opaque payment nonce from Accept.js.
 */
export async function createARBSubscription({
  name,
  email,
  companyName,
  opaqueData,
  amount,
}: {
  name: string;
  email: string;
  companyName: string;
  opaqueData: { dataDescriptor: string; dataValue: string };
  amount: number;
}): Promise<{ subscriptionId: string } | { error: string }> {
  // Split name into first/last
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || name;
  const lastName = parts.slice(1).join(" ") || name;

  // Start date: today in YYYY-MM-DD format
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const response = (await apiCall({
    ARBCreateSubscriptionRequest: {
      merchantAuthentication: merchantAuth(),
      subscription: {
        name: `${companyName} Monthly Bookkeeping`,
        paymentSchedule: {
          interval: { length: 1, unit: "months" },
          startDate,
          totalOccurrences: 9999,
        },
        amount,
        payment: {
          opaqueData: {
            dataDescriptor: opaqueData.dataDescriptor,
            dataValue: opaqueData.dataValue,
          },
        },
        customer: { email },
        billTo: { firstName, lastName },
      },
    },
  })) as {
    subscriptionId?: string;
    messages?: {
      resultCode: string;
      message?: Array<{ code: string; text: string }>;
    };
  };

  if (response.messages?.resultCode !== "Ok" || !response.subscriptionId) {
    const msg =
      response.messages?.message?.[0]?.text ?? "Failed to create subscription";
    console.error("[authorizenet] ARB create failed:", msg);
    return { error: msg };
  }

  return { subscriptionId: response.subscriptionId };
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
