
import { Campaign } from "@/types";
import { weeks } from "@/services/mockData";
import { validateCSVHeaders } from "./validateImport";
import { toast } from "sonner";
import { processWeeklyData } from "./processWeeklyData";

export function parseCSVData(csvData: string): Partial<Campaign>[] {
  const rows = csvData.split('\n');
  if (rows.length < 2) {
    toast.error("Le fichier CSV doit contenir au moins un en-tête et une ligne de données");
    return [];
  }

  const headers = rows[0].split(',').map(header => header.trim());
  console.log("Colonnes CSV détectées:", headers);
  
  const { columnIndices, weekIndices, missingColumns } = validateCSVHeaders(headers);

  if (missingColumns.length > 0) {
    toast.error(`Colonnes manquantes: ${missingColumns.join(', ')}`);
    return [];
  }

  if (Object.keys(weekIndices).length === 0) {
    toast.warning("Aucune colonne de semaine (S1-S52) trouvée dans le fichier");
  }
  
  const campaigns: Partial<Campaign>[] = [];
  const errors: string[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    
    const columns = rows[i].split(',').map(col => col.trim());
    
    if (columns.length < 3) {
      console.warn(`Ligne ${i + 1} ignorée - nombre insuffisant de colonnes:`, columns);
      continue;
    }

    const campaign = processCampaignRow(columns, columnIndices, weekIndices, i + 1, errors);
    if (campaign) {
      campaigns.push(campaign);
    }
  }
  
  handleImportResults(campaigns, rows.length - 1, errors);
  return campaigns;
}

function processCampaignRow(
  columns: string[], 
  columnIndices: Record<string, number>, 
  weekIndices: Record<string, number>,
  rowNum: number,
  errors: string[]
): Partial<Campaign> | null {
  try {
    // Process budget
    const totalBudgetRaw = columnIndices.totalBudget >= 0 ? columns[columnIndices.totalBudget] || "0" : "0";
    const cleanBudget = totalBudgetRaw.replace(/[^\d.,]/g, '').replace(',', '.');
    const totalBudget = parseFloat(cleanBudget) || 0;
    
    // Process weekly data
    const { weeklyBudgetPercentages, weeklyBudgets, weeklyActuals } = 
      processWeeklyData(columns, weekIndices, totalBudget, rowNum);
    
    // Process date
    let startDate = processDate(columns[columnIndices.startDate]);
    
    return {
      id: `imported-${Date.now()}-${rowNum}`,
      mediaChannel: columns[columnIndices.mediaChannel] || "OTHER",
      campaignName: columns[columnIndices.campaignName] || `Campagne importée ${rowNum}`,
      marketingObjective: columns[columnIndices.objective] || "OTHER",
      targetAudience: columns[columnIndices.audience] || "Audience générale",
      startDate,
      totalBudget,
      durationDays: columnIndices.duration >= 0 && columns[columnIndices.duration] ? 
        parseInt(columns[columnIndices.duration]) || 30 : 30,
      status: "ACTIVE" as const,
      weeklyBudgetPercentages,
      weeklyBudgets,
      weeklyActuals
    };
  } catch (error) {
    console.error(`Error processing row ${rowNum}:`, error);
    errors.push(`Erreur ligne ${rowNum}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return null;
  }
}

function processDate(dateStr: string): string {
  if (!dateStr) return "2025-01-01";
  
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(dateStr)) {
      const parts = dateStr.split(/[\/\-\.]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error("Date parsing error:", e);
  }
  
  return "2025-01-01";
}

function handleImportResults(campaigns: Partial<Campaign>[], totalRows: number, errors: string[]) {
  if (errors.length > 0) {
    toast.warning(`${errors.length} erreur(s) lors de l'import. Vérifiez la console pour plus de détails.`);
    console.error("Erreurs d'import:", errors);
  }
  
  if (campaigns.length === 0) {
    toast.error("Aucune campagne valide n'a pu être importée");
  } else if (campaigns.length < totalRows) {
    toast.warning(`${campaigns.length} campagnes importées sur ${totalRows} lignes`);
  } else {
    toast.success(`${campaigns.length} campagnes importées avec succès`);
  }
}
