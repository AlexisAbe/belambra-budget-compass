
import { Campaign, BudgetSummary, ChannelSummary, ObjectiveSummary } from "@/types";

export const useCampaignSummaries = (campaigns: Campaign[]) => {
  const getBudgetSummary = (): BudgetSummary => {
    let totalPlanned = 0;
    let totalActual = 0;
    
    campaigns.forEach(campaign => {
      Object.values(campaign.weeklyBudgets).forEach(amount => {
        totalPlanned += amount;
      });
      
      Object.values(campaign.weeklyActuals).forEach(amount => {
        totalActual += amount;
      });
    });
    
    const variance = totalActual - totalPlanned;
    const variancePercentage = totalPlanned > 0 
      ? (variance / totalPlanned) * 100 
      : 0;
    
    return {
      totalPlanned,
      totalActual,
      variance,
      variancePercentage
    };
  };

  const getChannelSummaries = (): ChannelSummary[] => {
    const channelMap = new Map<string, { planned: number; actual: number }>();
    
    campaigns.forEach(campaign => {
      const channel = campaign.mediaChannel;
      
      if (!channelMap.has(channel)) {
        channelMap.set(channel, { planned: 0, actual: 0 });
      }
      
      const channelData = channelMap.get(channel)!;
      
      Object.values(campaign.weeklyBudgets).forEach(amount => {
        channelData.planned += amount;
      });
      
      Object.values(campaign.weeklyActuals).forEach(amount => {
        channelData.actual += amount;
      });
    });
    
    return Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      planned: data.planned,
      actual: data.actual,
      variance: data.actual - data.planned
    }));
  };

  const getObjectiveSummaries = (): ObjectiveSummary[] => {
    const objectiveMap = new Map<string, { planned: number; actual: number }>();
    
    campaigns.forEach(campaign => {
      const objective = campaign.marketingObjective;
      
      if (!objectiveMap.has(objective)) {
        objectiveMap.set(objective, { planned: 0, actual: 0 });
      }
      
      const objectiveData = objectiveMap.get(objective)!;
      
      Object.values(campaign.weeklyBudgets).forEach(amount => {
        objectiveData.planned += amount;
      });
      
      Object.values(campaign.weeklyActuals).forEach(amount => {
        objectiveData.actual += amount;
      });
    });
    
    return Array.from(objectiveMap.entries()).map(([objective, data]) => ({
      objective,
      planned: data.planned,
      actual: data.actual,
      variance: data.actual - data.planned
    }));
  };

  return {
    getBudgetSummary,
    getChannelSummaries,
    getObjectiveSummaries
  };
};
