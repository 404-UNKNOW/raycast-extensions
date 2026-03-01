import { Color } from "@raycast/api";

type RamenState = "empty" | "eating" | "full";

export function getRamenVisuals(
  monthRevenueCents: number,
  monthlyGoalAmount: number,
) {
  const currentRevenue = monthRevenueCents / 100;
  const safeGoal = monthlyGoalAmount > 0 ? monthlyGoalAmount : 1;
  const progressPercent = (currentRevenue / safeGoal) * 100;

  let state: RamenState = "eating";
  if (currentRevenue <= 0) {
    state = "empty";
  } else if (progressPercent >= 100) {
    state = "full";
  }

  switch (state) {
    case "empty":
      return {
        // 第一阶段：深灰色
        icon: { source: "bowl-empty.svg", tintColor: Color.SecondaryText },
        tooltipText:
          "Rome wasn't built in a day. Neither is MRR. Keep cooking! 🍜",
        statusMessage: "Rome wasn't built in a day...",
        progressPercent,
      };

    case "eating":
      return {
        // 第二阶段：暖橘色
        icon: { source: "bowl-eating.svg", tintColor: Color.Orange },
        tooltipText: `Ramen Progress: ${progressPercent.toFixed(1)}% 🥢`,
        statusMessage: "Progress to Ramen",
        progressPercent,
      };

    case "full":
      return {
        // 第三阶段：高亮绿
        icon: { source: "bowl-full.svg", tintColor: Color.Green },
        tooltipText: "GOAL REACHED! Ramen Profitable! 💸🎉",
        statusMessage: "🎉 Goal Reached!",
        progressPercent,
      };
  }
}
