
export interface Campaign {
  id: string;
  mediaChannel: string;
  campaignName: string;
  marketingObjective: string;
  targetAudience: string;
  startDate: string;
  totalBudget: number;
  durationDays: number;
  status: CampaignStatus;
  weeklyBudgetPercentages?: Record<string, number>; // Field for percentage allocation
  weeklyBudgets: Record<string, number>;
  weeklyActuals: Record<string, number>;
  durationMode?: 'days' | 'endDate'; // Add this property to support both duration modes
  endDate?: string; // Add this to support end date mode
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

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED';

// Add conversion function to map from Database model to our application model
export interface SupabaseCampaign {
  id: string;
  media_channel: string;
  campaign_name: string;
  marketing_objective: string;
  target_audience: string;
  start_date: string;
  total_budget: number;
  duration_days: number;
  status: string;
}

export interface SupabaseWeeklyBudget {
  id: string;
  campaign_id: string;
  week: string;
  planned_amount: number;
  actual_amount: number | null;
  percentage: number | null;
}
