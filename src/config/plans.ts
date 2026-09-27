export const MONTHLY_PLAN_ID = (import.meta.env.VITE_RAZORPAY_PLAN_ID || 'plan_TgakKXEKRZYOJg') as string;
export const YEARLY_PLAN_ID = (import.meta.env.VITE_RAZORPAY_YEARLY_PLAN_ID || 'plan_Th1lVp9Rvq3SxO') as string;

export type PlanType = 'monthly' | 'yearly';

export interface PlanConfig {
  id: PlanType;
  planId: string;
  name: string;
  price: number;
  amountPaise: number;
  monthlyEquivalent: number;
  billingPeriod: 'month' | 'year';
  billedText: string;
  fullYearEquivalent?: number;
  savingsAmount?: number;
  savingsPercent?: number;
  badge?: string;
  tagline: string;
  trialDays: number;
  isRecommended?: boolean;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  yearly: {
    id: 'yearly',
    planId: YEARLY_PLAN_ID,
    name: 'Yearly Plan',
    price: 899,
    amountPaise: 89900,
    monthlyEquivalent: 75, // ₹899 / 12 = ₹74.92 ≈ ₹75/mo
    billingPeriod: 'year',
    billedText: 'Billed annually at ₹899',
    fullYearEquivalent: 1788, // ₹149 * 12
    savingsAmount: 889, // 1788 - 899
    savingsPercent: 50,
    badge: 'SAVE 50% • BEST VALUE',
    tagline: 'Only ₹75/mo — our most popular & cost-effective plan',
    trialDays: 7,
    isRecommended: true,
  },
  monthly: {
    id: 'monthly',
    planId: MONTHLY_PLAN_ID,
    name: 'Monthly Plan',
    price: 149,
    amountPaise: 14900,
    monthlyEquivalent: 149,
    billingPeriod: 'month',
    billedText: 'Billed monthly at ₹149',
    tagline: 'Standard monthly flexibility with no long-term commitment',
    trialDays: 7,
    isRecommended: false,
  },
};

export const DEFAULT_PLAN_TYPE: PlanType = 'yearly';

export function getPlanConfig(planType: PlanType): PlanConfig {
  return PLANS[planType] || PLANS.yearly;
}

export function getPlanByRazorpayId(rzpPlanId: string | null | undefined): PlanConfig {
  if (rzpPlanId === YEARLY_PLAN_ID) {
    return PLANS.yearly;
  }
  return PLANS.monthly;
}
