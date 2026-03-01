import { getPreferenceValues } from "@raycast/api";
import { startOfDay, subDays, isAfter } from "date-fns";

export interface Transaction {
  id: string;
  amount: number;
  time: string;
  platform: "Stripe" | "Lemon";
}

interface StripeTransaction {
  id: string;
  amount: number;
  created: number;
  type: string;
}

interface StripeResponse {
  data: StripeTransaction[];
}

interface LemonSqueezyOrder {
  id: string;
  attributes: {
    total: number;
    created_at: string;
    status: string;
  };
}

interface LemonSqueezyResponse {
  data: LemonSqueezyOrder[];
}

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const LEMON_SQUEEZY_API_BASE = "https://api.lemonsqueezy.com/v1";

/**
 * 核心聚合方法
 */
export async function fetchAllRevenue() {
  const { stripeSecretKey, lemonSqueezyApiKey } = getPreferenceValues();

  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = subDays(todayStart, 6);

  const [stripeData, lemonData] = await Promise.all([
    stripeSecretKey
      ? fetchStripeData(stripeSecretKey, sevenDaysAgo, todayStart)
      : null,
    lemonSqueezyApiKey
      ? fetchLemonData(lemonSqueezyApiKey, sevenDaysAgo, todayStart)
      : null,
  ]);

  const todayRevenue =
    (stripeData?.totalToday || 0) + (lemonData?.totalToday || 0);

  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const dStr = subDays(todayStart, 6 - i).toDateString();
    dailyMap[dStr] =
      (stripeData?.daily[dStr] || 0) + (lemonData?.daily[dStr] || 0);
  }
  const last7Days = Object.values(dailyMap);

  const recentTransactions = [
    ...(stripeData?.recent || []),
    ...(lemonData?.recent || []),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 3);

  return {
    todayRevenue,
    stripeRevenue: stripeData?.totalToday || 0,
    lemonRevenue: lemonData?.totalToday || 0,
    last7Days,
    recentTransactions,
  };
}

async function fetchStripeData(apiKey: string, since: Date, todayStart: Date) {
  try {
    const ts = Math.floor(since.getTime() / 1000);
    const response = await fetch(
      `${STRIPE_API_BASE}/balance_transactions?created[gte]=${ts}&limit=100`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    const { data } = (await response.json()) as StripeResponse;

    const daily: Record<string, number> = {};
    const recent: Transaction[] = [];
    let totalToday = 0;

    data?.forEach((tx) => {
      if (tx.type === "payout") return;
      const txDate = new Date(tx.created * 1000);
      const amount = tx.amount / 100;
      const dateKey = txDate.toDateString();
      daily[dateKey] = (daily[dateKey] || 0) + amount;
      if (!isAfter(todayStart, txDate)) totalToday += amount;
      recent.push({
        id: tx.id,
        amount,
        time: txDate.toISOString(),
        platform: "Stripe",
      });
    });

    return { daily, recent, totalToday };
  } catch {
    return { daily: {}, recent: [], totalToday: 0 };
  }
}

async function fetchLemonData(apiKey: string, since: Date, todayStart: Date) {
  try {
    const iso = since.toISOString();
    const response = await fetch(
      `${LEMON_SQUEEZY_API_BASE}/orders?filter[status]=paid&filter[created_at][min]=${iso}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
        },
      },
    );
    const { data } = (await response.json()) as LemonSqueezyResponse;

    const daily: Record<string, number> = {};
    const recent: Transaction[] = [];
    let totalToday = 0;

    data?.forEach((order) => {
      const attr = order.attributes;
      const txDate = new Date(attr.created_at);
      const amount = attr.total / 100;
      const dateKey = txDate.toDateString();
      daily[dateKey] = (daily[dateKey] || 0) + amount;
      if (!isAfter(todayStart, txDate)) totalToday += amount;
      recent.push({
        id: order.id,
        amount,
        time: attr.created_at,
        platform: "Lemon",
      });
    });

    return { daily, recent, totalToday };
  } catch {
    return { daily: {}, recent: [], totalToday: 0 };
  }
}
