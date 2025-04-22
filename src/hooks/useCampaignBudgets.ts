
import { Campaign } from "@/types";
import { saveCampaign } from "@/lib/supabaseUtils";

export const useCampaignBudgets = (setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>) => {
  const updateWeeklyBudget = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          const newBudgets = {
            ...campaign.weeklyBudgets,
            [week]: amount
          };
          
          const newPercentages = { ...(campaign.weeklyBudgetPercentages || {}) };
          if (campaign.totalBudget > 0) {
            newPercentages[week] = (amount / campaign.totalBudget) * 100;
          }
          
          const updatedCampaign = {
            ...campaign,
            weeklyBudgets: newBudgets,
            weeklyBudgetPercentages: newPercentages
          };
          
          const timer = setTimeout(() => {
            saveCampaign(updatedCampaign).catch(err => 
              console.error("Error saving budget update:", err)
            );
          }, 1000);
          
          return updatedCampaign;
        }
        return campaign;
      })
    );
  };

  const updateWeeklyActual = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          const updatedCampaign = {
            ...campaign,
            weeklyActuals: {
              ...campaign.weeklyActuals,
              [week]: amount
            }
          };
          
          const timer = setTimeout(() => {
            saveCampaign(updatedCampaign).catch(err => 
              console.error("Error saving actual update:", err)
            );
          }, 1000);
          
          return updatedCampaign;
        }
        return campaign;
      })
    );
  };

  const updateWeeklyPercentage = (campaignId: string, week: string, percentage: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          const otherWeeksTotal = Object.entries(campaign.weeklyBudgetPercentages || {})
            .filter(([weekKey]) => weekKey !== week)
            .reduce((sum, [, val]) => sum + val, 0);
          
          if (otherWeeksTotal + percentage > 100) {
            toast.error("Le total des pourcentages ne peut pas dépasser 100%");
            return campaign;
          }
          
          const newPercentages = {
            ...(campaign.weeklyBudgetPercentages || {}),
            [week]: percentage
          };
          
          const newBudgets = { ...campaign.weeklyBudgets };
          newBudgets[week] = (percentage / 100) * campaign.totalBudget;
          
          const updatedCampaign = {
            ...campaign,
            weeklyBudgetPercentages: newPercentages,
            weeklyBudgets: newBudgets
          };
          
          const timer = setTimeout(() => {
            saveCampaign(updatedCampaign).catch(err => 
              console.error("Error saving percentage update:", err)
            );
          }, 1000);
          
          return updatedCampaign;
        }
        return campaign;
      })
    );
  };

  return {
    updateWeeklyBudget,
    updateWeeklyActual,
    updateWeeklyPercentage
  };
};
