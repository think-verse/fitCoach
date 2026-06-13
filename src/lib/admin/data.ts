import "server-only";

/**
 * Admin-only Firestore + Auth queries. These read across all users (privileged)
 * and are ONLY ever called from admin pages/routes guarded by isAdminAuthed().
 * Keep these read-only and best-effort — this is a small-scale admin view.
 */
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { SubscriptionTier } from "@/lib/firestore/types";

export interface AdminUserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  creationTime: string | null;
  lastSignInTime: string | null;
  tier: SubscriptionTier | "unknown";
}

export interface AdminUsersPage {
  users: AdminUserRow[];
  nextPageToken: string | null;
}

/**
 * List Firebase Auth users (one page) merged with each user's Firestore
 * subscription tier (users/{uid}/meta/subscription).
 */
export async function listUsers(
  pageSize: number,
  pageToken?: string,
): Promise<AdminUsersPage> {
  const auth = adminAuth();
  const db = adminDb();
  const result = await auth.listUsers(pageSize, pageToken || undefined);

  const users: AdminUserRow[] = await Promise.all(
    result.users.map(async (u) => {
      let tier: SubscriptionTier | "unknown" = "unknown";
      try {
        const sub = await db
          .collection("users")
          .doc(u.uid)
          .collection("meta")
          .doc("subscription")
          .get();
        if (sub.exists) {
          tier = ((sub.data()?.tier as SubscriptionTier) ?? "free") || "free";
        } else {
          tier = "free";
        }
      } catch {
        tier = "unknown";
      }
      return {
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        creationTime: u.metadata.creationTime ?? null,
        lastSignInTime: u.metadata.lastSignInTime ?? null,
        tier,
      };
    }),
  );

  return { users, nextPageToken: result.pageToken ?? null };
}

export interface AdminUsageStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  totalAnalyses: number;
  totalCheckins: number;
}

/**
 * Aggregate platform-wide counts. Iterates all auth users (admin scale is
 * small) and counts each user's analyses/checkins via aggregate count queries.
 */
export async function getUsageStats(): Promise<AdminUsageStats> {
  const auth = adminAuth();
  const db = adminDb();

  let totalUsers = 0;
  let paidUsers = 0;
  let freeUsers = 0;
  let totalAnalyses = 0;
  let totalCheckins = 0;

  let pageToken: string | undefined;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      totalUsers++;
      const userRef = db.collection("users").doc(u.uid);

      // Tier
      try {
        const sub = await userRef.collection("meta").doc("subscription").get();
        const tier = (sub.data()?.tier as SubscriptionTier) ?? "free";
        if (tier && tier !== "free") paidUsers++;
        else freeUsers++;
      } catch {
        freeUsers++;
      }

      // Counts (aggregate — cheap, no doc reads)
      try {
        const a = await userRef.collection("analyses").count().get();
        totalAnalyses += a.data().count;
      } catch {
        /* best-effort */
      }
      try {
        const c = await userRef.collection("checkins").count().get();
        totalCheckins += c.data().count;
      } catch {
        /* best-effort */
      }
    }
    pageToken = res.pageToken;
  } while (pageToken);

  return { totalUsers, paidUsers, freeUsers, totalAnalyses, totalCheckins };
}

export interface AdminPayment {
  id: string;
  userId: string | null;
  email: string | null;
  tier: string | null;
  amount: number | null;
  currency: string | null;
  orderId: string | null;
  status: string | null;
  createdAt: string | null;
}

/**
 * Recent payments from the top-level "payments" collection, newest first.
 * Returns [] if the collection doesn't exist / is empty.
 */
export async function getRecentPayments(limit: number): Promise<AdminPayment[]> {
  const db = adminDb();
  try {
    const snap = await db
      .collection("payments")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: (data.userId as string) ?? null,
        email: (data.email as string) ?? null,
        tier: (data.tier as string) ?? null,
        amount: typeof data.amount === "number" ? data.amount : null,
        currency: (data.currency as string) ?? null,
        orderId: (data.orderId as string) ?? null,
        status: (data.status as string) ?? null,
        createdAt: (data.createdAt as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}
