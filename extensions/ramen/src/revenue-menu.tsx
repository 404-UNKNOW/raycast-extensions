import {
  MenuBarExtra,
  Icon,
  Color,
  open,
  getPreferenceValues,
  openCommandPreferences,
  showHUD,
} from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { fetchAllRevenue } from "./utils/api";
import { useEffect, useRef } from "react";
import { format } from "date-fns";

const formatCurrency = (amount: number, symbol: string = "$") => {
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Unicode 极简火花图：▂▃▅▆▇
 */
function generateSparkline(data: number[]): string {
  if (data.length === 0) return "No data";
  const ticks = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  if (range === 0) return ticks[0].repeat(data.length);
  return data
    .map((val) => {
      const tickIndex = Math.ceil(((val - min) / range) * (ticks.length - 1));
      return ticks[tickIndex];
    })
    .join("");
}

export default function Command() {
  const preferences = getPreferenceValues();
  const { currencySymbol = "$", monthlyGoal = "2000" } = preferences;

  const [isPrivate, setIsPrivate] = useCachedState("ramen-privacy-mode", false);
  const goal = parseFloat(monthlyGoal);

  const { data, isLoading, revalidate } = useCachedPromise(
    fetchAllRevenue,
    [],
    {
      initialData: {
        todayRevenue: 0,
        stripeRevenue: 0,
        lemonRevenue: 0,
        last7Days: [],
        recentTransactions: [],
      },
      keepPreviousData: true,
    },
  );

  const revenue = data?.todayRevenue ?? 0;
  const formattedRevenue = formatCurrency(revenue, currencySymbol);

  // 目标达成 HUD 提醒
  const prevRevenueRef = useRef(revenue);
  useEffect(() => {
    if (revenue >= goal && prevRevenueRef.current < goal && revenue > 0) {
      showHUD("🍜 Congratulations! You are Ramen Profitable! 🎉");
    }
    prevRevenueRef.current = revenue;
  }, [revenue, goal]);

  const menuBarTitle = isLoading
    ? "..."
    : isPrivate
      ? undefined
      : formattedRevenue;
  const sparkline = generateSparkline(data?.last7Days || []);

  return (
    <MenuBarExtra
      icon={{
        source:
          revenue >= goal
            ? "bowl-full.svg"
            : revenue > 0
              ? "bowl-eating.svg"
              : "bowl-empty.svg",
        tintColor:
          revenue >= goal
            ? Color.Green
            : revenue > 0
              ? Color.Orange
              : Color.SecondaryText,
      }}
      title={menuBarTitle}
      isLoading={isLoading}
    >
      <MenuBarExtra.Section title="Ramen Status">
        <MenuBarExtra.Item
          title="Today's Total"
          subtitle={formattedRevenue}
          icon={Icon.BarChart}
        />
        <MenuBarExtra.Item
          title="Monthly Goal"
          subtitle={formatCurrency(goal, currencySymbol)}
          icon={Icon.Flag}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title={`Trend: ${sparkline} (7d)`}>
        <MenuBarExtra.Item
          title="Goal Progress"
          subtitle={`${((revenue / goal) * 100).toFixed(1)}%`}
          icon={
            revenue >= goal
              ? { source: Icon.Checkmark, tintColor: Color.Green }
              : Icon.LevelMeter
          }
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Recent Drops 💰">
        {data?.recentTransactions.length === 0 ? (
          <MenuBarExtra.Item title="No sales yet today. Keep cooking! 🍜" />
        ) : (
          data?.recentTransactions.map((tx) => (
            <MenuBarExtra.Item
              key={tx.id}
              title={`+ ${formatCurrency(tx.amount, currencySymbol)}`}
              subtitle={`${tx.platform} • ${format(new Date(tx.time), "HH:mm")}`}
              icon={{ source: Icon.ArrowUpCircle, tintColor: Color.Green }}
              onAction={() =>
                open(
                  tx.platform === "Stripe"
                    ? `https://dashboard.stripe.com/payments/${tx.id}`
                    : `https://app.lemonsqueezy.com/orders/${tx.id}`,
                )
              }
            />
          ))
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="🚀 Quick Actions">
        <MenuBarExtra.Item
          title="Share Progress on X (Twitter)"
          icon={{ source: "🐦" }}
          onAction={async () => {
            const tweetText = `I'm officially "Ramen Profitable" today! 🍜\n\nToday's Revenue: ${formattedRevenue}\nMonthly Goal: ${formatCurrency(goal, currencySymbol)}\n\nVisualizing my MRR with Ramen for Raycast.`;
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            await open(url);
          }}
          shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
        />
        <MenuBarExtra.Item
          title="Analyze Churn & LTV (Pro Dashboard)"
          icon={{ source: Icon.Star, tintColor: Color.Yellow }}
          onAction={() => open("https://ramen-landing.vercel.app")}
          shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Settings & Privacy">
        <MenuBarExtra.Item
          title={isPrivate ? "Show Revenue" : "Hide Revenue (Privacy Mode)"}
          icon={isPrivate ? Icon.Eye : Icon.EyeDisabled}
          shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
          onAction={() => setIsPrivate(!isPrivate)}
        />
        <MenuBarExtra.Item
          title="Force Refresh"
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={revalidate}
        />
        <MenuBarExtra.Item
          title="Configure Extension"
          shortcut={{ modifiers: ["cmd"], key: "," }}
          onAction={openCommandPreferences}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
