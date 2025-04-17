
export interface Campaign {
  id: string;
  mediaChannel: string;
  campaignName: string;
  marketingObjective: string;
  targetAudience: string;
  startDate: string;
  totalBudget: number;
  durationDays: number;
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
