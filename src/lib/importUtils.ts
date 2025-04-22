
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
  
  console.log("CSV Headers:", headers);
  
  // Find indices for required columns - check for various possible header names
  const findColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };
  
  const mediaChannelIndex = findColumnIndex(['media', 'levier', 'channel']);
  const campaignNameIndex = findColumnIndex(['campagne', 'campaign', 'nom']);
  const objectiveIndex = findColumnIndex(['objectif', 'objective']);
  const audienceIndex = findColumnIndex(['cible', 'audience', 'target']);
  const startDateIndex = findColumnIndex(['début', 'debut', 'start', 'date']);
  const totalBudgetIndex = findColumnIndex(['budget total', 'total budget', 'budget']);
  const durationIndex = findColumnIndex(['durée', 'duree', 'duration', 'jours', 'days']);
  
  console.log("Found column indices:", {
    mediaChannelIndex,
    campaignNameIndex,
    objectiveIndex,
    audienceIndex,
    startDateIndex,
    totalBudgetIndex,
    durationIndex
  });
  
  // Find week columns (S1, S2, etc.)
  const weekIndices: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    
    // Check for various week formatting: S1, S01, S1 (%), Semaine 1, etc.
    let weekMatch = header.match(/^s\s*(\d+)(?:\s*\(%\))?$/i);
    if (!weekMatch) {
      weekMatch = header.match(/^s(?:emaine)?\s*(\d+)(?:\s*\(%\))?$/i);
    }
    if (!weekMatch) {
      weekMatch = header.match(/^w(?:eek)?\s*(\d+)(?:\s*\(%\))?$/i);
    }
    
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1]);
      const weekKey = `S${weekNum}`;
      weekIndices[weekKey] = i;
      console.log(`Found week column: ${headers[i]} at index ${i}, mapped to key ${weekKey}`);
    }
  }
  
  console.log("Found week indices:", weekIndices);
  
  // Parse data rows
  const campaigns: Partial<Campaign>[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue; // Skip empty rows
    
    const columns = rows[i].split(',').map(col => col ? col.trim() : '');
    
    if (columns.length < 3) {
      console.warn(`Skipping row ${i} with insufficient columns:`, columns);
      continue; // Skip rows with too few columns
    }
    
    // Initialize data structures
    const weeklyBudgetPercentages: Record<string, number> = {};
    const weeklyBudgets: Record<string, number> = {};
    const weeklyActuals: Record<string, number> = {};
    
    // Extract total budget - Add null/undefined check
    const totalBudgetRaw = totalBudgetIndex >= 0 ? columns[totalBudgetIndex] || "0" : "0";
    // Clean the budget value (remove currency symbols, spaces, etc.)
    let cleanBudget = totalBudgetRaw.replace(/[^\d.,]/g, '').replace(',', '.');
    const totalBudget = parseFloat(cleanBudget) || 0;
    
    console.log(`Row ${i} total budget raw: "${totalBudgetRaw}", cleaned: "${cleanBudget}", parsed: ${totalBudget}`);
    
    // Get weekly percentage values
    Object.entries(weekIndices).forEach(([week, index]) => {
      if (index < columns.length) {
        // Extract percentage (remove % sign if present)
        let percentValue = columns[index] || "0";
        // Make sure percentValue is a string before calling replace
        percentValue = typeof percentValue === 'string' ? percentValue.replace(/[%\s]/g, '').replace(',', '.') : "0";
        if (percentValue === "") percentValue = "0";
        
        const percentage = parseFloat(percentValue) || 0;
        
        weeklyBudgetPercentages[week] = percentage;
        
        // Calculate absolute budget value based on percentage
        const weeklyBudget = (percentage / 100) * totalBudget;
        weeklyBudgets[week] = weeklyBudget;
        
        console.log(`Row ${i}, Week ${week}: ${percentage}% of ${totalBudget} = ${weeklyBudget}`);
      } else {
        weeklyBudgetPercentages[week] = 0;
        weeklyBudgets[week] = 0;
      }
      weeklyActuals[week] = 0; // Initialize actuals as 0
    });
    
    // If no week data was found, initialize with zeros for all weeks
    if (Object.keys(weeklyBudgetPercentages).length === 0) {
      weeks.forEach(week => {
        weeklyBudgetPercentages[week] = 0;
        weeklyBudgets[week] = 0;
        weeklyActuals[week] = 0;
      });
    }
    
    // Format date to YYYY-MM-DD
    let startDate = "2025-01-01";
    if (startDateIndex >= 0 && columns[startDateIndex]) {
      try {
        const dateStr = columns[startDateIndex];
        
        // Check if it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          startDate = dateStr;
        }
        // Check if it's in DD/MM/YYYY or DD-MM-YYYY format
        else if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(dateStr)) {
          const parts = dateStr.split(/[\/\-\.]/);
          startDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        // Try as standard date
        else {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            startDate = date.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        console.error("Date parsing error:", e);
      }
    }
    
    // Create campaign object - Add null/undefined checks for all column values
    const campaign: Partial<Campaign> = {
      id: `imported-${Date.now()}-${i}`,
      mediaChannel: mediaChannelIndex >= 0 && columns[mediaChannelIndex] ? columns[mediaChannelIndex] : "OTHER",
      campaignName: campaignNameIndex >= 0 && columns[campaignNameIndex] ? columns[campaignNameIndex] : `Campagne importée ${i}`,
      marketingObjective: objectiveIndex >= 0 && columns[objectiveIndex] ? columns[objectiveIndex] : "OTHER",
      targetAudience: audienceIndex >= 0 && columns[audienceIndex] ? columns[audienceIndex] : "Audience générale",
      startDate,
      totalBudget,
      durationDays: durationIndex >= 0 && columns[durationIndex] ? parseInt(columns[durationIndex]) || 30 : 30,
      status: "ACTIVE" as const,
      weeklyBudgetPercentages,
      weeklyBudgets,
      weeklyActuals
    };
    
    console.log("Created campaign:", campaign.campaignName);
    console.log("Weekly budget percentages:", campaign.weeklyBudgetPercentages);
    console.log("Weekly budgets:", campaign.weeklyBudgets);
    
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
          console.log("Parsed campaigns from CSV:", campaigns);
          resolve(campaigns);
        } 
        // Handle JSON data
        else if (file.name.endsWith('.json')) {
          try {
            let campaigns = JSON.parse(fileContent);
            
            // Ensure it's an array
            if (!Array.isArray(campaigns)) {
              campaigns = [campaigns];
            }
            
            // Process each campaign to ensure weekly budgets are calculated from percentages
            campaigns = campaigns.map((campaign: Partial<Campaign>) => {
              if (campaign.weeklyBudgetPercentages && campaign.totalBudget) {
                const weeklyBudgets: Record<string, number> = {};
                
                Object.entries(campaign.weeklyBudgetPercentages).forEach(([week, percentage]) => {
                  weeklyBudgets[week] = (percentage / 100) * (campaign.totalBudget || 0);
                });
                
                return {
                  ...campaign,
                  weeklyBudgets,
                  weeklyActuals: campaign.weeklyActuals || {}
                };
              }
              return campaign;
            });
            
            console.log("Parsed campaigns from JSON:", campaigns);
            resolve(campaigns);
          } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            reject(new Error("Format JSON invalide"));
          }
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
