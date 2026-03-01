import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  stripeSecretKey: string;
}

export const getStripeHeaders = () => {
  const { stripeSecretKey } = getPreferenceValues<Preferences>();
  return {
    Authorization: `Bearer ${stripeSecretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
};

export const STRIPE_API_BASE = "https://api.stripe.com/v1";
