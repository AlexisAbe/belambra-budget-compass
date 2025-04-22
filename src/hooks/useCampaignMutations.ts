
import { Campaign } from "@/types";
import { saveCampaign, deleteCampaign as deleteSupabaseCampaign, createCampaignVersion } from "@/lib/supabaseUtils";
import { toast } from "sonner";

export const useCampaignMutations = (setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>) => {
  const addCampaign = async (newCampaign: Omit<Campaign, "id" | "weeklyBudgets" | "weeklyActuals">) => {
    const weeklyBudgets: Record<string, number> = {};
    const weeklyActuals: Record<string, number> = {};
    const weeklyBudgetPercentages: Record<string, number> = {};
    
    // Initialize all weeks with zero budget
    const weeks = Array.from({ length: 52 }, (_, i) => `S${i + 1}`);
    weeks.forEach(week => {
      weeklyBudgets[week] = 0;
      weeklyActuals[week] = 0;
      weeklyBudgetPercentages[week] = 0;
    });
    
    const campaignWithBudgets: Campaign = {
      ...newCampaign,
      id: "",
      status: 'ACTIVE',
      weeklyBudgets,
      weeklyActuals,
      weeklyBudgetPercentages
    };
    
    const success = await saveCampaign(campaignWithBudgets);
    
    if (success) {
      setCampaigns(prev => [...prev, campaignWithBudgets]);
      toast.success("Nouvelle campagne ajoutée");
    } else {
      toast.error("Erreur lors de l'ajout de la campagne");
    }
  };

  const updateCampaign = async (updatedCampaign: Campaign) => {
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
    const success = await deleteSupabaseCampaign(id);
    
    if (success) {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      toast.success("Campagne supprimée");
    } else {
      toast.error("Erreur lors de la suppression de la campagne");
    }
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

  return {
    addCampaign,
    updateCampaign,
    deleteCampaign,
    createVersion
  };
};
