/**
 * GoHighLevel (GHL) API client.
 * Uses the Location API (v1) to look up contacts by email and manage tags.
 */

const GHL_API_KEY = process.env.GHL_API_KEY ?? "";
const GHL_BASE = "https://rest.gohighlevel.com/v1";

function headers() {
  return {
    Authorization: `Bearer ${GHL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

interface GHLContact {
  id: string;
  email: string;
  tags: string[];
}

/**
 * Look up a contact in GHL by email.
 */
export async function findContactByEmail(
  email: string
): Promise<GHLContact | null> {
  const res = await fetch(
    `${GHL_BASE}/contacts/lookup?email=${encodeURIComponent(email)}`,
    { headers: headers() }
  );
  if (!res.ok) {
    console.error(`[ghl] Lookup failed for ${email}: ${res.status}`);
    return null;
  }
  const data = (await res.json()) as {
    contacts?: Array<{ id: string; email: string; tags: string[] }>;
  };
  return data.contacts?.[0] ?? null;
}

/**
 * Add a tag to a GHL contact.
 */
export async function addTag(
  contactId: string,
  tag: string
): Promise<boolean> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ tags: [tag] }),
  });
  if (!res.ok) {
    console.error(`[ghl] Failed to add tag "${tag}" to ${contactId}: ${res.status}`);
    return false;
  }
  return true;
}

/**
 * Remove a tag from a GHL contact.
 */
export async function removeTag(
  contactId: string,
  tag: string
): Promise<boolean> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
    method: "DELETE",
    headers: headers(),
    body: JSON.stringify({ tags: [tag] }),
  });
  if (!res.ok) {
    console.error(`[ghl] Failed to remove tag "${tag}" from ${contactId}: ${res.status}`);
    return false;
  }
  return true;
}

const OVERDUE_TAG = "Subscription Overdue";

/**
 * Tag overdue clients and untag active clients in GHL.
 * Called after every subscription sync.
 */
export async function syncGHLTags(
  overdueEmails: string[],
  activeEmails: string[]
) {
  if (!GHL_API_KEY) {
    console.log("[ghl] No GHL_API_KEY set, skipping tag sync");
    return;
  }

  // Tag overdue clients
  for (const email of overdueEmails) {
    try {
      const contact = await findContactByEmail(email);
      if (!contact) {
        console.log(`[ghl] No contact found for ${email}, skipping`);
        continue;
      }
      if (contact.tags.includes(OVERDUE_TAG)) {
        continue; // Already tagged
      }
      await addTag(contact.id, OVERDUE_TAG);
      console.log(`[ghl] Tagged "${OVERDUE_TAG}" on ${email}`);
    } catch (err) {
      console.error(`[ghl] Error tagging ${email}:`, err);
    }
  }

  // Remove tag from active clients
  for (const email of activeEmails) {
    try {
      const contact = await findContactByEmail(email);
      if (!contact) continue;
      if (!contact.tags.includes(OVERDUE_TAG)) {
        continue; // Not tagged, nothing to do
      }
      await removeTag(contact.id, OVERDUE_TAG);
      console.log(`[ghl] Removed "${OVERDUE_TAG}" from ${email}`);
    } catch (err) {
      console.error(`[ghl] Error untagging ${email}:`, err);
    }
  }
}
