import React, { createContext, useState, useContext, useEffect } from "react";
import { Campaign, BudgetSummary, ChannelSummary, ObjectiveSummary } from "@/types";
import { getInitialCampaigns, weeks } from "@/services/mockData";
import { toast } from "sonner";

interface CampaignContextType {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  addCampaign: (campaign: Omit<Campaign, "id" | "weeklyBudgets" | "weeklyActuals">) => void;
  updateCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
  updateWeeklyBudget: (campaignId: string, week: string, amount: number) => void;
  updateWeeklyActual: (campaignId: string, week: string, amount: number) => void;
  updateWeeklyPercentage: (campaignId: string, week: string, percentage: number) => void;
  getBudgetSummary: () => BudgetSummary;
  getChannelSummaries: () => ChannelSummary[];
  getObjectiveSummaries: () => ObjectiveSummary[];
  currentWeek: string;
  resetToMockData: () => void;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentWeek, setCurrentWeek] = useState("S12"); // Assume we're in week 12 of 2025

  useEffect(() => {
    // Load initial data
    setCampaigns(getInitialCampaigns());
  }, []);

  const resetToMockData = () => {
    setCampaigns(getInitialCampaigns());
    toast.success("Données réinitialisées");
  };

  const addCampaign = (newCampaign: Omit<Campaign, "id" | "weeklyBudgets" | "weeklyActuals">) => {
    const id = Date.now().toString();
    const weeklyBudgets: Record<string, number> = {};
    const weeklyActuals: Record<string, number> = {};
    const weeklyBudgetPercentages: Record<string, number> = {};
    
    // Initialize all weeks with zero budget
    weeks.forEach(week => {
      weeklyBudgets[week] = 0;
      weeklyActuals[week] = 0;
      weeklyBudgetPercentages[week] = 0;
    });
    
    setCampaigns(prev => [
      ...prev,
      {
        ...newCampaign,
        id,
        status: 'ACTIVE', // Set default status
        weeklyBudgets,
        weeklyActuals,
        weeklyBudgetPercentages
      }
    ]);
    
    toast.success("Nouvelle campagne ajoutée");
  };

  const updateCampaign = (updatedCampaign: Campaign) => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      )
    );
    toast.success("Campagne mise à jour");
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    toast.success("Campagne supprimée");
  };

  const updateWeeklyBudget = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          return {
            ...campaign,
            weeklyBudgets: {
              ...campaign.weeklyBudgets,
              [week]: amount
            }
          };
        }
        return campaign;
      })
    );
  };

  const updateWeeklyActual = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          return {
            ...campaign,
            weeklyActuals: {
              ...campaign.weeklyActuals,
              [week]: amount
            }
          };
        }
        return campaign;
      })
    );
  };

  const updateWeeklyPercentage = (campaignId: string, week: string, percentage: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          // Calculate total budget excluding current week
          const otherWeeksTotal = Object.entries(campaign.weeklyBudgetPercentages || {})
            .filter(([weekKey]) => weekKey !== week)
            .reduce((sum, [, val]) => sum + val, 0);
          
          // Check if adding this percentage would exceed 100%
          if (otherWeeksTotal + percentage > 100) {
            toast.error("Le total des pourcentages ne peut pas dépasser 100%");
            return campaign;
          }
          
          // Update the percentage
          const newPercentages = {
            ...(campaign.weeklyBudgetPercentages || {}),
            [week]: percentage
          };
          
          // Recalculate budget amounts based on percentages
          const newBudgets = { ...campaign.weeklyBudgets };
          
          Object.entries(newPercentages).forEach(([weekKey, percentValue]) => {
            newBudgets[weekKey] = (percentValue / 100) * campaign.totalBudget;
          });
          
          return {
            ...campaign,
            weeklyBudgetPercentages: newPercentages,
            weeklyBudgets: newBudgets
          };
        }
        return campaign;
      })
    );
  };

  const getBudgetSummary = (): BudgetSummary => {
    let totalPlanned = 0;
    let totalActual = 0;
    
    campaigns.forEach(campaign => {
      // Sum planned budgets for all weeks
      Object.values(campaign.weeklyBudgets).forEach(amount => {
        totalPlanned += amount;
      });
      
      // Sum actual spends for all weeks
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
      
      // Sum planned budgets
      Object.values(campaign.weeklyBudgets).forEach(amount => {
        channelData.planned += amount;
      });
      
      // Sum actual spends
      Object.values(campaign.weeklyActuals).forEach(amount => {
        channelData.actual += amount;
      });
    });
    
    // Convert map to array of ChannelSummary objects
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
      
      // Sum planned budgets
      Object.values(campaign.weeklyBudgets).forEach(amount => {
        objectiveData.planned += amount;
      });
      
      // Sum actual spends
      Object.values(campaign.weeklyActuals).forEach(amount => {
        objectiveData.actual += amount;
      });
    });
    
    // Convert map to array of ObjectiveSummary objects
    return Array.from(objectiveMap.entries()).map(([objective, data]) => ({
      objective,
      planned: data.planned,
      actual: data.actual,
      variance: data.actual - data.planned
    }));
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        setCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        updateWeeklyBudget,
        updateWeeklyActual,
        updateWeeklyPercentage,
        getBudgetSummary,
        getChannelSummaries,
        getObjectiveSummaries,
        currentWeek,
        resetToMockData
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaigns must be used within a CampaignProvider");
  }
  return context;
};
