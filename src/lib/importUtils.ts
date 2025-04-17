
import { Campaign } from "@/types";
import { toast } from "sonner";
import { weeks } from "@/services/mockData";

/**
 * Validates a CSV or JSON file for campaign import
 */
export function validateImportFile(file: File): boolean {
  const validExtensions = ['.csv', '.json', '.xlsx', '.xls'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    toast.error(`Format de fichier non supporté. Utilisez CSV, JSON ou Excel.`);
    return false;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    toast.error(`Fichier trop volumineux. Maximum 5MB.`);
    return false;
  }
  
  return true;
}

/**
 * Parse CSV string data into array of campaigns
 */
export function parseCSVData(csvData: string): Partial<Campaign>[] {
  const rows = csvData.split('\n');
  const headers = rows[0].split(',').map(header => header.trim());
  
  // Find indices for required columns
  const mediaChannelIndex = headers.findIndex(h => h.toLowerCase().includes('media') || h.toLowerCase().includes('levier'));
  const campaignNameIndex = headers.findIndex(h => h.toLowerCase().includes('campagne') || h.toLowerCase().includes('campaign'));
  const objectiveIndex = headers.findIndex(h => h.toLowerCase().includes('objectif') || h.toLowerCase().includes('objective'));
  const audienceIndex = headers.findIndex(h => h.toLowerCase().includes('cible') || h.toLowerCase().includes('audience'));
  const startDateIndex = headers.findIndex(h => h.toLowerCase().includes('début') || h.toLowerCase().includes('start'));
  const totalBudgetIndex = headers.findIndex(h => h.toLowerCase().includes('budget') && h.toLowerCase().includes('total'));
  const durationIndex = headers.findIndex(h => h.toLowerCase().includes('durée') || h.toLowerCase().includes('duration') || h.toLowerCase().includes('jours'));
  
  // Find week columns (S1, S2, etc.)
  const weekIndices: Record<string, number> = {};
  weeks.forEach(week => {
    const index = headers.findIndex(h => h.toLowerCase() === week.toLowerCase());
    if (index !== -1) {
      weekIndices[week] = index;
    }
  });
  
  // Parse data rows
  const campaigns: Partial<Campaign>[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue; // Skip empty rows
    
    const columns = rows[i].split(',').map(col => col.trim());
    
    // Initialize weekly budgets and actuals
    const weeklyBudgets: Record<string, number> = {};
    const weeklyActuals: Record<string, number> = {};
    
    // Get weekly values
    Object.entries(weekIndices).forEach(([week, index]) => {
      if (index < columns.length && columns[index]) {
        // For now, we assume all values are budgets
        // Later we could improve to detect which are actuals vs planned
        weeklyBudgets[week] = Number(columns[index].replace(/[^\d.-]/g, '')) || 0;
      } else {
        weeklyBudgets[week] = 0;
      }
      weeklyActuals[week] = 0; // Initialize actuals as 0
    });
    
    // Create campaign object
    const campaign: Partial<Campaign> = {
      id: `imported-${Date.now()}-${i}`,
      mediaChannel: mediaChannelIndex >= 0 ? columns[mediaChannelIndex] : "OTHER",
      campaignName: campaignNameIndex >= 0 ? columns[campaignNameIndex] : `Campagne importée ${i}`,
      marketingObjective: objectiveIndex >= 0 ? columns[objectiveIndex] : "OTHER",
      targetAudience: audienceIndex >= 0 ? columns[audienceIndex] : "Audience générale",
      startDate: startDateIndex >= 0 ? columns[startDateIndex] : "2025-01-01",
      totalBudget: totalBudgetIndex >= 0 ? Number(columns[totalBudgetIndex].replace(/[^\d.-]/g, '')) || 0 : 0,
      durationDays: durationIndex >= 0 ? Number(columns[durationIndex]) || 30 : 30,
      weeklyBudgets,
      weeklyActuals
    };
    
    campaigns.push(campaign);
  }
  
  return campaigns;
}

/**
 * Handle file import process
 */
export function processImportFile(file: File): Promise<Partial<Campaign>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          reject(new Error("Échec de lecture du fichier"));
          return;
        }
        
        const fileContent = event.target.result as string;
        
        // Handle CSV data
        if (file.name.endsWith('.csv')) {
          const campaigns = parseCSVData(fileContent);
          resolve(campaigns);
        } 
        // Handle JSON data
        else if (file.name.endsWith('.json')) {
          const campaigns = JSON.parse(fileContent);
          resolve(campaigns);
        }
        // Handle Excel files - for now just show a message that we'd need a library
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          toast.error("L'import Excel nécessite l'installation d'une librairie supplémentaire");
          reject(new Error("Format Excel non supporté pour l'instant"));
        }
        else {
          reject(new Error("Format de fichier non supporté"));
        }
      } catch (error) {
        console.error("Error processing import file:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Échec de lecture du fichier"));
    };
    
    reader.readAsText(file);
  });
}
