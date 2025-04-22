
import React, { createContext, useState, useContext, useEffect } from "react";
import { Campaign, BudgetSummary, ChannelSummary, ObjectiveSummary } from "@/types";
import { toast } from "sonner";
import { fetchCampaigns, saveCampaign } from "@/lib/supabaseUtils";
import { getInitialCampaigns } from "@/services/mockData";
import { useCampaignMutations } from "@/hooks/useCampaignMutations";
import { useCampaignBudgets } from "@/hooks/useCampaignBudgets";
import { useCampaignSummaries } from "@/hooks/useCampaignSummaries";

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
  hasLoadedData: boolean;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentWeek] = useState("S12"); // Assume we're in week 12 of 2025
  const [loading, setLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const { addCampaign, updateCampaign, deleteCampaign, createVersion } = useCampaignMutations(setCampaigns);
  const { updateWeeklyBudget, updateWeeklyActual, updateWeeklyPercentage } = useCampaignBudgets(setCampaigns);
  const { getBudgetSummary, getChannelSummaries, getObjectiveSummaries } = useCampaignSummaries(campaigns);

  // Save campaigns to local storage whenever they change
  useEffect(() => {
    if (campaigns.length > 0 && !loading) {
      localStorage.setItem('campaigns', JSON.stringify(campaigns));
    }
  }, [campaigns, loading]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        
        // Try to load from local storage first
        const localCampaigns = localStorage.getItem('campaigns');
        if (localCampaigns) {
          const parsedCampaigns = JSON.parse(localCampaigns);
          setCampaigns(parsedCampaigns);
          setHasLoadedData(true);
          toast.success("Données chargées depuis le stockage local");
          setLoading(false);
          return;
        }
        
        // If no local storage data, try loading from Supabase
        const supabaseCampaigns = await fetchCampaigns();
        
        if (supabaseCampaigns.length > 0) {
          setCampaigns(supabaseCampaigns);
          setHasLoadedData(true);
          toast.success("Données chargées depuis Supabase");
        } else {
          // Only load mock data if we haven't loaded any data before
          setCampaigns(getInitialCampaigns());
          toast.info("Données de démonstration chargées");
        }
      } catch (error) {
        console.error("Error loading campaigns:", error);
        // Only load mock data if we haven't loaded any data before
        setCampaigns(getInitialCampaigns());
        toast.error("Erreur lors du chargement des données, utilisation des données de démonstration");
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const resetToMockData = () => {
    localStorage.removeItem('campaigns');
    setCampaigns(getInitialCampaigns());
    toast.success("Données réinitialisées");
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
        loading,
        hasLoadedData
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
