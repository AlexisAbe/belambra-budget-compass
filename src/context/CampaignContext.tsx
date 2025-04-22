import React, { createContext, useState, useContext, useEffect } from "react";
import { Campaign, BudgetSummary, ChannelSummary, ObjectiveSummary } from "@/types";
import { weeks } from "@/services/mockData";
import { toast } from "sonner";
import { 
  fetchCampaigns, 
  saveCampaign, 
  deleteCampaign as deleteSupabaseCampaign,
  createCampaignVersion
} from "@/lib/supabaseUtils";
import { getInitialCampaigns } from "@/services/mockData";

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
  createVersion: (campaignId: string, versionName: string, versionNotes?: string) => Promise<boolean>;
  loading: boolean;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentWeek, setCurrentWeek] = useState("S12"); // Assume we're in week 12 of 2025
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from Supabase
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const supabaseCampaigns = await fetchCampaigns();
        
        if (supabaseCampaigns.length > 0) {
          setCampaigns(supabaseCampaigns);
          toast.success("Données chargées depuis Supabase");
        } else {
          // If no campaigns in Supabase, load mock data
          setCampaigns(getInitialCampaigns());
          toast.info("Données de démonstration chargées");
        }
      } catch (error) {
        console.error("Error loading campaigns:", error);
        setCampaigns(getInitialCampaigns());
        toast.error("Erreur lors du chargement des données, utilisation des données de démonstration");
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const resetToMockData = () => {
    setCampaigns(getInitialCampaigns());
    toast.success("Données réinitialisées");
  };

  const addCampaign = async (newCampaign: Omit<Campaign, "id" | "weeklyBudgets" | "weeklyActuals">) => {
    const weeklyBudgets: Record<string, number> = {};
    const weeklyActuals: Record<string, number> = {};
    const weeklyBudgetPercentages: Record<string, number> = {};
    
    // Initialize all weeks with zero budget
    weeks.forEach(week => {
      weeklyBudgets[week] = 0;
      weeklyActuals[week] = 0;
      weeklyBudgetPercentages[week] = 0;
    });
    
    const campaignWithBudgets: Campaign = {
      ...newCampaign,
      id: "",
      status: 'ACTIVE', // Set default status
      weeklyBudgets,
      weeklyActuals,
      weeklyBudgetPercentages
    };
    
    // Save to Supabase
    const success = await saveCampaign(campaignWithBudgets);
    
    if (success) {
      setCampaigns(prev => [...prev, campaignWithBudgets]);
      toast.success("Nouvelle campagne ajoutée");
    } else {
      toast.error("Erreur lors de l'ajout de la campagne");
    }
  };

  const updateCampaign = async (updatedCampaign: Campaign) => {
    // Save to Supabase
    const success = await saveCampaign(updatedCampaign);
    
    if (success) {
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        )
      );
      toast.success("Campagne mise à jour");
    } else {
      toast.error("Erreur lors de la mise à jour de la campagne");
    }
  };

  const deleteCampaign = async (id: string) => {
    // Delete from Supabase
    const success = await deleteSupabaseCampaign(id);
    
    if (success) {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      toast.success("Campagne supprimée");
    } else {
      toast.error("Erreur lors de la suppression de la campagne");
    }
  };

  const updateWeeklyBudget = (campaignId: string, week: string, amount: number) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === campaignId) {
          // Update the budget amount
          const newBudgets = {
            ...campaign.weeklyBudgets,
            [week]: amount
          };
          
          // Recalculate the percentage based on the new amount
          const newPercentages = { ...(campaign.weeklyBudgetPercentages || {}) };
          if (campaign.totalBudget > 0) {
            newPercentages[week] = (amount / campaign.totalBudget) * 100;
          }
          
          const updatedCampaign = {
            ...campaign,
            weeklyBudgets: newBudgets,
            weeklyBudgetPercentages: newPercentages
          };
          
          // Debounced save to Supabase
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
          
          // Debounced save to Supabase
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
          
          // Recalculate budget amounts based on the new percentage
          const newBudgets = { ...campaign.weeklyBudgets };
          newBudgets[week] = (percentage / 100) * campaign.totalBudget;
          
          const updatedCampaign = {
            ...campaign,
            weeklyBudgetPercentages: newPercentages,
            weeklyBudgets: newBudgets
          };
          
          // Debounced save to Supabase
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

  const createVersion = async (campaignId: string, versionName: string, versionNotes?: string): Promise<boolean> => {
    const success = await createCampaignVersion(campaignId, versionName, versionNotes);
    
    if (success) {
      toast.success(`Version "${versionName}" créée avec succès`);
    } else {
      toast.error("Erreur lors de la création de la version");
    }
    
    return success;
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
        resetToMockData,
        createVersion,
        loading
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
