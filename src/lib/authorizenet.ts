/**
 * Authorize.net ARB (Automated Recurring Billing) API client.
 * Uses fetch() against the JSON API directly — no npm dependency.
 */

const API_LOGIN_ID =
  process.env.AUTHORIZE_NET_LOGIN_ID_PROD ||
  process.env.AUTHORIZE_NET_LOGIN_ID ||
  "";
const TRANSACTION_KEY =
  process.env.AUTHORIZE_NET_TRANSACTION_KEY_PROD ||
  process.env.AUTHORIZE_NET_TRANSACTION_KEY ||
  "";

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

/**
 * Charge a customer profile immediately via authCaptureTransaction.
 */
async function chargeCustomerProfile({
  customerProfileId,
  customerPaymentProfileId,
  amount,
}: {
  customerProfileId: string;
  customerPaymentProfileId: string;
  amount: number;
}): Promise<{ transactionId: string } | { error: string }> {
  const response = (await apiCall({
    createTransactionRequest: {
      merchantAuthentication: merchantAuth(),
      transactionRequest: {
        transactionType: "authCaptureTransaction",
        amount: amount.toFixed(2),
        profile: {
          customerProfileId,
          paymentProfile: {
            paymentProfileId: customerPaymentProfileId,
          },
        },
      },
    },
  })) as {
    transactionResponse?: {
      responseCode?: string;
      transId?: string;
      errors?: Array<{ errorCode: string; errorText: string }>;
    };
    messages?: {
      resultCode: string;
      message?: Array<{ code: string; text: string }>;
    };
  };

  const txn = response.transactionResponse;
  // responseCode "1" = approved, "4" = held for FDS review (still authorized)
  const approved = txn?.responseCode === "1" || txn?.responseCode === "4";
  if (response.messages?.resultCode !== "Ok" || !txn || !approved) {
    const msg =
      txn?.errors?.[0]?.errorText ??
      response.messages?.message?.[0]?.text ??
      "Immediate charge failed";
    console.error("[authorizenet] Immediate charge failed:", msg);
    return { error: msg };
  }

  return { transactionId: txn.transId ?? "unknown" };
}

/**
 * Returns the 2nd of next month as "YYYY-MM-DD".
 */
function getSecondOfNextMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 2);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-02`;
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
 * Charge immediately and create a recurring ARB subscription.
 *
 * Flow:
 * 1. Create a CIM customer profile with the Accept.js token
 * 2. Wait briefly for profile propagation
 * 3. Charge the customer immediately (initialAmount, e.g. $1)
 * 4. Create ARB subscription starting the 2nd of next month ($189/mo)
 */
export async function createARBSubscription({
  name,
  email,
  companyName,
  opaqueData,
  amount,
  initialAmount,
}: {
  name: string;
  email: string;
  companyName: string;
  opaqueData: { dataDescriptor: string; dataValue: string };
  amount: number;
  initialAmount?: number;
}): Promise<{ subscriptionId: string; transactionId: string } | { error: string }> {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || name;
  const lastName = parts.slice(1).join(" ") || name;

  // Step 1: Create customer profile with the Accept.js token
  const profileResponse = (await apiCall({
    createCustomerProfileRequest: {
      merchantAuthentication: merchantAuth(),
      profile: {
        email,
        paymentProfiles: [
          {
            billTo: { firstName, lastName },
            payment: {
              opaqueData: {
                dataDescriptor: opaqueData.dataDescriptor,
                dataValue: opaqueData.dataValue,
              },
            },
          },
        ],
      },
    },
  })) as {
    customerProfileId?: string;
    customerPaymentProfileIdList?: string[];
    messages?: {
      resultCode: string;
      message?: Array<{ code: string; text: string }>;
    };
  };

  if (
    profileResponse.messages?.resultCode !== "Ok" ||
    !profileResponse.customerProfileId
  ) {
    const msg =
      profileResponse.messages?.message?.[0]?.text ??
      "Failed to create payment profile";
    console.error("[authorizenet] CIM profile create failed:", msg);
    return { error: msg };
  }

  const customerProfileId = profileResponse.customerProfileId;
  const customerPaymentProfileId =
    profileResponse.customerPaymentProfileIdList?.[0];

  if (!customerPaymentProfileId) {
    return { error: "Payment profile was not created" };
  }

  // Step 2: Brief delay for profile propagation
  await new Promise((r) => setTimeout(r, 2000));

  // Step 3: Charge immediately (initialAmount if provided, otherwise full amount)
  const chargeResult = await chargeCustomerProfile({
    customerProfileId,
    customerPaymentProfileId,
    amount: initialAmount ?? amount,
  });

  if ("error" in chargeResult) {
    return { error: chargeResult.error };
  }

  console.log(
    `[authorizenet] Immediate charge successful: txn ${chargeResult.transactionId}`
  );

  // Step 4: Create ARB subscription starting 2nd of next month
  const startDate = getSecondOfNextMonth();

  const arbResponse = (await apiCall({
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
        profile: {
          customerProfileId,
          customerPaymentProfileId,
        },
      },
    },
  })) as {
    subscriptionId?: string;
    messages?: {
      resultCode: string;
      message?: Array<{ code: string; text: string }>;
    };
  };

  if (arbResponse.messages?.resultCode !== "Ok" || !arbResponse.subscriptionId) {
    const msg =
      arbResponse.messages?.message?.[0]?.text ??
      "Failed to create subscription";
    console.error("[authorizenet] ARB create failed:", msg);
    return { error: msg };
  }

  return {
    subscriptionId: arbResponse.subscriptionId,
    transactionId: chargeResult.transactionId,
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
