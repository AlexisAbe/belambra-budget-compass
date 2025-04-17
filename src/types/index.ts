
export interface Campaign {
  id: string;
  mediaChannel: string;
  campaignName: string;
  marketingObjective: string;
  targetAudience: string;
  startDate: string;
  totalBudget: number;
  durationDays: number;
  weeklyBudgetPercentages?: Record<string, number>; // New field for percentage allocation
  weeklyBudgets: Record<string, number>;
  weeklyActuals: Record<string, number>;
}

export interface WeeklyData {
  week: string;
  planned: number;
  actual: number;
}

export interface BudgetSummary {
  totalPlanned: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
}

export interface ChannelSummary {
  channel: string;
  planned: number;
  actual: number;
  variance: number;
}

export interface ObjectiveSummary {
  objective: string;
  planned: number;
  actual: number;
  variance: number;
}

export const mediaChannels = [
  "META",
  "GOOGLE",
  "YOUTUBE",
  "PROGRAMMATIC",
  "INFLUENCERS",
  "EMAIL",
  "NATIVE",
  "OTHER"
];

export const marketingObjectives = [
  "AWARENESS",
  "CONSIDERATION",
  "CONVERSION",
  "LOYALTY",
  "RETENTION",
  "OTHER"
];

// Add custom theme colors that match Belambra's brand
export const BELAMBRA_COLORS = {
  blue: "#005F9E",
  lightBlue: "#0085CA",
  darkBlue: "#00477A",
  teal: "#00B2A9",
  red: "#EC6571",
  gray: "#8E9196"
};
