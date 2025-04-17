
import { Campaign } from "@/types";

// Generate weeks for the year 2025
export const generateWeeks = (): string[] => {
  const weeks: string[] = [];
  for (let i = 1; i <= 52; i++) {
    weeks.push(`S${i}`);
  }
  return weeks;
};

export const weeks = generateWeeks();

// Generate random weekly budget distribution
const generateWeeklyBudgets = (totalBudget: number, startWeek: number, duration: number): Record<string, number> => {
  const budgets: Record<string, number> = {};
  let remainingBudget = totalBudget;
  
  // Distribute budget over weeks
  for (let i = 0; i < duration; i++) {
    const weekIndex = (startWeek + i - 1) % 52;
    const week = `S${weekIndex + 1}`;
    
    // Random budget for this week (but ensure we use the entire budget)
    const isLastWeek = i === duration - 1;
    const weekBudget = isLastWeek 
      ? remainingBudget 
      : Math.round((Math.random() * 0.3 + 0.7) * remainingBudget / (duration - i));
    
    budgets[week] = weekBudget;
    remainingBudget -= weekBudget;
  }
  
  return budgets;
};

// Generate random actual spend values (some variance from planned)
const generateActuals = (weeklyBudgets: Record<string, number>): Record<string, number> => {
  const actuals: Record<string, number> = {};
  
  Object.keys(weeklyBudgets).forEach(week => {
    // Only generate actuals for past weeks (let's assume we're in week 12 of 2025)
    const weekNum = parseInt(week.substring(1));
    if (weekNum <= 12) {
      // Random variance between -10% and +15%
      const variance = (Math.random() * 0.25) - 0.1;
      actuals[week] = Math.round(weeklyBudgets[week] * (1 + variance));
    } else {
      actuals[week] = 0; // No actual data for future weeks
    }
  });
  
  return actuals;
};

// Mock campaign data
export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    mediaChannel: "META",
    campaignName: "Vacances Été Famille",
    marketingObjective: "CONVERSION",
    targetAudience: "Famille avec enfants 3-12 ans",
    startDate: "2025-01-15",
    totalBudget: 120000,
    durationDays: 90,
    weeklyBudgets: generateWeeklyBudgets(120000, 3, 13),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "2",
    mediaChannel: "GOOGLE",
    campaignName: "Search Generique Ski",
    marketingObjective: "CONVERSION",
    targetAudience: "Skieurs actifs 25-45 ans",
    startDate: "2025-01-05",
    totalBudget: 85000,
    durationDays: 70,
    weeklyBudgets: generateWeeklyBudgets(85000, 1, 10),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "3",
    mediaChannel: "YOUTUBE",
    campaignName: "Branding Printemps",
    marketingObjective: "AWARENESS",
    targetAudience: "CSP+ urbains 30-55 ans",
    startDate: "2025-03-01",
    totalBudget: 150000,
    durationDays: 60,
    weeklyBudgets: generateWeeklyBudgets(150000, 9, 9),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "4",
    mediaChannel: "PROGRAMMATIC",
    campaignName: "Retargeting Été",
    marketingObjective: "CONSIDERATION",
    targetAudience: "Visiteurs site non convertis",
    startDate: "2025-04-15",
    totalBudget: 65000,
    durationDays: 120,
    weeklyBudgets: generateWeeklyBudgets(65000, 16, 17),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "5",
    mediaChannel: "META",
    campaignName: "Promo Flash Printemps",
    marketingObjective: "CONVERSION",
    targetAudience: "Clients base CRM actifs",
    startDate: "2025-03-20",
    totalBudget: 45000,
    durationDays: 15,
    weeklyBudgets: generateWeeklyBudgets(45000, 12, 2),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "6",
    mediaChannel: "INFLUENCERS",
    campaignName: "Ambassadeurs Montagne",
    marketingObjective: "AWARENESS",
    targetAudience: "Familles sportives 30-45 ans",
    startDate: "2025-01-10",
    totalBudget: 95000,
    durationDays: 60,
    weeklyBudgets: generateWeeklyBudgets(95000, 2, 9),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "7",
    mediaChannel: "EMAIL",
    campaignName: "Newsletter Offre Exclusive",
    marketingObjective: "LOYALTY",
    targetAudience: "Clients fidèles +2 séjours",
    startDate: "2025-02-01",
    totalBudget: 15000,
    durationDays: 7,
    weeklyBudgets: generateWeeklyBudgets(15000, 5, 1),
    weeklyActuals: {} // Will be generated later
  },
  {
    id: "8",
    mediaChannel: "NATIVE",
    campaignName: "Native Ads Magazine Voyage",
    marketingObjective: "CONSIDERATION",
    targetAudience: "CSP+ 35-60 ans",
    startDate: "2025-05-10",
    totalBudget: 70000,
    durationDays: 45,
    weeklyBudgets: generateWeeklyBudgets(70000, 19, 7),
    weeklyActuals: {} // Will be generated later
  }
];

// Generate actuals for past weeks
export const getInitialCampaigns = (): Campaign[] => {
  return mockCampaigns.map(campaign => ({
    ...campaign,
    weeklyActuals: generateActuals(campaign.weeklyBudgets)
  }));
};
