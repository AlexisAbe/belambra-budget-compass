
import { supabase } from "@/integrations/supabase/client";
import { Campaign, SupabaseCampaign, SupabaseWeeklyBudget } from "@/types";
import { weeks } from "@/services/mockData";

// Convert a Supabase campaign and its weekly budgets to our application Campaign model
export const convertToCampaign = (
  campaign: SupabaseCampaign, 
  weeklyBudgets: SupabaseWeeklyBudget[]
): Campaign => {
  const weeklyBudgetsMap: Record<string, number> = {};
  const weeklyActualsMap: Record<string, number> = {};
  const weeklyBudgetPercentagesMap: Record<string, number> = {};

  // Initialize all weeks with zero values
  weeks.forEach(week => {
    weeklyBudgetsMap[week] = 0;
    weeklyActualsMap[week] = 0;
    weeklyBudgetPercentagesMap[week] = 0;
  });

  // Fill in the actual values from the database
  weeklyBudgets.forEach(budget => {
    weeklyBudgetsMap[budget.week] = budget.planned_amount;
    weeklyActualsMap[budget.week] = budget.actual_amount || 0;
    weeklyBudgetPercentagesMap[budget.week] = budget.percentage || 0;
  });

  return {
    id: campaign.id,
    mediaChannel: campaign.media_channel,
    campaignName: campaign.campaign_name,
    marketingObjective: campaign.marketing_objective,
    targetAudience: campaign.target_audience,
    startDate: campaign.start_date,
    totalBudget: campaign.total_budget,
    durationDays: campaign.duration_days,
    status: campaign.status as Campaign['status'],
    weeklyBudgets: weeklyBudgetsMap,
    weeklyActuals: weeklyActualsMap,
    weeklyBudgetPercentages: weeklyBudgetPercentagesMap
  };
};

// Convert our application Campaign model to Supabase campaign and weekly budgets
export const convertFromCampaign = (campaign: Campaign): {
  campaignData: Omit<SupabaseCampaign, 'id'>,
  weeklyBudgets: Omit<SupabaseWeeklyBudget, 'id' | 'campaign_id'>[]
} => {
  const campaignData = {
    media_channel: campaign.mediaChannel,
    campaign_name: campaign.campaignName,
    marketing_objective: campaign.marketingObjective,
    target_audience: campaign.targetAudience,
    start_date: campaign.startDate,
    total_budget: campaign.totalBudget,
    duration_days: campaign.durationDays,
    status: campaign.status
  };

  const weeklyBudgets = Object.entries(campaign.weeklyBudgets)
    .filter(([_, amount]) => amount > 0) // Only include weeks with a budget
    .map(([week, planned_amount]) => ({
      week,
      planned_amount,
      actual_amount: campaign.weeklyActuals[week] || null,
      percentage: campaign.weeklyBudgetPercentages?.[week] || null
    }));

  return { campaignData, weeklyBudgets };
};

// Fetch all campaigns with their weekly budgets from Supabase
export const fetchCampaigns = async (): Promise<Campaign[]> => {
  try {
    // Fetch campaigns
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) throw campaignsError;
    if (!campaignsData) return [];

    // Fetch all weekly budgets
    const { data: weeklyBudgetsData, error: weeklyBudgetsError } = await supabase
      .from('weekly_budgets')
      .select('*');

    if (weeklyBudgetsError) throw weeklyBudgetsError;
    if (!weeklyBudgetsData) return [];

    // Group weekly budgets by campaign_id
    const weeklyBudgetsByCampaign: Record<string, SupabaseWeeklyBudget[]> = {};
    weeklyBudgetsData.forEach(budget => {
      if (!weeklyBudgetsByCampaign[budget.campaign_id]) {
        weeklyBudgetsByCampaign[budget.campaign_id] = [];
      }
      weeklyBudgetsByCampaign[budget.campaign_id].push(budget);
    });

    // Convert to our application model
    return campaignsData.map(campaign => 
      convertToCampaign(
        campaign as SupabaseCampaign, 
        weeklyBudgetsByCampaign[campaign.id] || []
      )
    );
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

// Save a campaign to Supabase
export const saveCampaign = async (campaign: Campaign): Promise<boolean> => {
  try {
    const { campaignData, weeklyBudgets } = convertFromCampaign(campaign);
    
    if (campaign.id) {
      // Update existing campaign
      const { error: updateError } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', campaign.id);
        
      if (updateError) throw updateError;
      
      // First delete existing weekly budgets for this campaign
      const { error: deleteError } = await supabase
        .from('weekly_budgets')
        .delete()
        .eq('campaign_id', campaign.id);
        
      if (deleteError) throw deleteError;
    } else {
      // Insert new campaign
      const { data: newCampaign, error: insertError } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select('id')
        .single();
        
      if (insertError) throw insertError;
      if (!newCampaign) throw new Error('Failed to create new campaign');
      
      campaign.id = newCampaign.id;
    }
    
    // Insert weekly budgets
    if (weeklyBudgets.length > 0) {
      const weeklyBudgetsWithCampaignId = weeklyBudgets.map(budget => ({
        ...budget,
        campaign_id: campaign.id
      }));
      
      const { error: budgetError } = await supabase
        .from('weekly_budgets')
        .insert(weeklyBudgetsWithCampaignId);
        
      if (budgetError) throw budgetError;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving campaign:', error);
    return false;
  }
};

// Delete a campaign from Supabase
export const deleteCampaign = async (campaignId: string): Promise<boolean> => {
  try {
    // Delete the campaign (cascade will delete weekly budgets)
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }
};

// Fetch campaign versions
export const fetchCampaignVersions = async (campaignId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('campaign_versions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('version_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaign versions:', error);
    return [];
  }
};

// Create a manual version of a campaign
export const createCampaignVersion = async (
  campaignId: string, 
  versionName: string, 
  versionNotes?: string
): Promise<boolean> => {
  try {
    // Fetch current campaign data
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
      
    if (campaignError) throw campaignError;
    if (!campaignData) throw new Error('Campaign not found');
    
    // Create a new version entry
    const { data: versionData, error: versionError } = await supabase
      .from('campaign_versions')
      .insert({
        campaign_id: campaignId,
        media_channel: campaignData.media_channel,
        campaign_name: campaignData.campaign_name,
        marketing_objective: campaignData.marketing_objective,
        target_audience: campaignData.target_audience,
        start_date: campaignData.start_date,
        total_budget: campaignData.total_budget,
        duration_days: campaignData.duration_days,
        status: campaignData.status,
        user_id: campaignData.user_id,
        version_name: versionName,
        version_notes: versionNotes
      })
      .select('id')
      .single();
      
    if (versionError) throw versionError;
    if (!versionData) throw new Error('Failed to create version');
    
    // Fetch weekly budgets
    const { data: weeklyBudgetsData, error: weeklyBudgetsError } = await supabase
      .from('weekly_budgets')
      .select('*')
      .eq('campaign_id', campaignId);
      
    if (weeklyBudgetsError) throw weeklyBudgetsError;
    
    // Create version entries for weekly budgets
    if (weeklyBudgetsData && weeklyBudgetsData.length > 0) {
      const versionBudgets = weeklyBudgetsData.map(budget => ({
        campaign_version_id: versionData.id,
        week: budget.week,
        planned_amount: budget.planned_amount,
        actual_amount: budget.actual_amount,
        percentage: budget.percentage
      }));
      
      const { error: budgetVersionError } = await supabase
        .from('weekly_budget_versions')
        .insert(versionBudgets);
        
      if (budgetVersionError) throw budgetVersionError;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating campaign version:', error);
    return false;
  }
};
