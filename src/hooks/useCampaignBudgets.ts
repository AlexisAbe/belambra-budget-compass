
import { Campaign } from "@/types";

export const useCampaignBudgets = (setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>) => {
  // Function to update weekly budgets
  const updateWeeklyBudget = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => {
      const updatedCampaigns = prev.map(campaign => {
        if (campaign.id === campaignId) {
          // Create a shallow copy of the campaign
          const updatedCampaign = { ...campaign };
          // Create a shallow copy of the weeklyBudgets
          updatedCampaign.weeklyBudgets = { ...updatedCampaign.weeklyBudgets };
          // Update the specific week's budget
          updatedCampaign.weeklyBudgets[week] = amount;
          return updatedCampaign;
        }
        return campaign;
      });
      
      // Save to local storage
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
      
      return updatedCampaigns;
    });
  };

  // Function to update weekly actuals
  const updateWeeklyActual = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => {
      const updatedCampaigns = prev.map(campaign => {
        if (campaign.id === campaignId) {
          // Create a shallow copy of the campaign
          const updatedCampaign = { ...campaign };
          // Create a shallow copy of the weeklyActuals
          updatedCampaign.weeklyActuals = { ...updatedCampaign.weeklyActuals };
          // Update the specific week's actual spend
          updatedCampaign.weeklyActuals[week] = amount;
          return updatedCampaign;
        }
        return campaign;
      });
      
      // Save to local storage
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
      
      return updatedCampaigns;
    });
  };

  // Function to update weekly budget percentage
  const updateWeeklyPercentage = (campaignId: string, week: string, percentage: number) => {
    setCampaigns(prev => {
      const updatedCampaigns = prev.map(campaign => {
        if (campaign.id === campaignId) {
          // Create a shallow copy of the campaign
          const updatedCampaign = { ...campaign };
          
          // Make sure weeklyBudgetPercentages exists
          if (!updatedCampaign.weeklyBudgetPercentages) {
            updatedCampaign.weeklyBudgetPercentages = {};
          } else {
            // Create a shallow copy of the weeklyBudgetPercentages
            updatedCampaign.weeklyBudgetPercentages = { ...updatedCampaign.weeklyBudgetPercentages };
          }
          
          // Update the specific week's percentage
          updatedCampaign.weeklyBudgetPercentages[week] = percentage;
          
          // Calculate the corresponding budget amount based on percentage
          const budgetAmount = (percentage / 100) * updatedCampaign.totalBudget;
          
          // Update the weekly budget amount
          updatedCampaign.weeklyBudgets = { ...updatedCampaign.weeklyBudgets };
          updatedCampaign.weeklyBudgets[week] = budgetAmount;
          
          return updatedCampaign;
        }
        return campaign;
      });
      
      // Save to local storage
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
      
      return updatedCampaigns;
    });
  };

  return {
    updateWeeklyBudget,
    updateWeeklyActual,
    updateWeeklyPercentage
  };
};
