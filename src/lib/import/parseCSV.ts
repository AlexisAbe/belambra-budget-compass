
import { Campaign } from "@/types";
import { weeks } from "@/services/mockData";
import { validateCSVHeaders } from "./validateImport";
import { toast } from "sonner";
import { processWeeklyData } from "./processWeeklyData";

export function parseCSVData(csvData: string): Partial<Campaign>[] {
  // Détecter le séparateur (virgule ou point-virgule)
  const firstLine = csvData.split('\n')[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  console.log(`Séparateur détecté: "${separator}"`);
  
  const rows = csvData.split('\n');
  if (rows.length < 2) {
    toast.error("Le fichier CSV doit contenir au moins un en-tête et une ligne de données");
    return [];
  }

  // Traiter les en-têtes
  const headers = rows[0].split(separator).map(header => header.trim());
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
  const duplicates: Set<string> = new Set();
  
  // Analyser chaque ligne
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    
    const columns = rows[i].split(separator).map(col => col.trim());
    
    if (columns.length < 3) {
      console.warn(`Ligne ${i + 1} ignorée - nombre insuffisant de colonnes:`, columns);
      continue;
    }

    const campaign = processCampaignRow(columns, columnIndices, weekIndices, i + 1, errors);
    
    if (campaign) {
      // Vérifier les doublons par nom de campagne
      const campaignKey = `${campaign.mediaChannel}-${campaign.campaignName}`.toLowerCase();
      if (duplicates.has(campaignKey)) {
        console.warn(`Ligne ${i + 1} ignorée - campagne en doublon: ${campaign.campaignName}`);
        continue;
      }
      
      duplicates.add(campaignKey);
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
    // Traiter le nom de la campagne
    const campaignName = columns[columnIndices.campaignName]?.trim() || `Campagne importée ${rowNum}`;
    
    // Traiter le canal média (si vide ou invalide, utiliser "OTHER")
    let mediaChannel = columns[columnIndices.mediaChannel]?.trim() || "OTHER";
    if (mediaChannel && !["META", "GOOGLE", "TIK TOK", "DISPLAY", "OTHER"].includes(mediaChannel.toUpperCase())) {
      console.warn(`Ligne ${rowNum}: Média non reconnu "${mediaChannel}", remplacé par "OTHER"`);
      mediaChannel = "OTHER";
    } else {
      mediaChannel = mediaChannel.toUpperCase();
    }
    
    // Traiter l'objectif marketing
    let objective = columns[columnIndices.objective]?.trim() || "OTHER";
    if (objective && !["AWARENESS", "CONSIDERATION", "CONVERSION", "OTHER"].includes(objective.toUpperCase())) {
      console.warn(`Ligne ${rowNum}: Objectif non reconnu "${objective}", remplacé par "OTHER"`);
      objective = "OTHER";
    } else {
      objective = objective.toUpperCase();
    }

    // Traiter le budget
    const totalBudgetRaw = columnIndices.totalBudget >= 0 ? columns[columnIndices.totalBudget] || "0" : "0";
    const cleanBudget = totalBudgetRaw.replace(/[^\d.,]/g, '').replace(',', '.');
    const totalBudget = parseFloat(cleanBudget) || 0;
    
    // Traiter l'audience cible
    const targetAudience = columns[columnIndices.audience]?.trim() || "Audience générale";
    
    // Traiter la date de début
    const startDate = processDate(columns[columnIndices.startDate]?.trim() || "");
    
    // Traiter la durée
    const durationDays = columnIndices.duration >= 0 && columns[columnIndices.duration] 
      ? parseInt(columns[columnIndices.duration].replace(/\D/g, '')) || 30 
      : 30;

    // Traiter les données hebdomadaires
    const { weeklyBudgetPercentages, weeklyBudgets, weeklyActuals } = 
      processWeeklyData(columns, weekIndices, totalBudget, rowNum);
    
    return {
      id: `imported-${Date.now()}-${rowNum}`,
      mediaChannel,
      campaignName,
      marketingObjective: objective,
      targetAudience,
      startDate,
      totalBudget,
      durationDays,
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
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Gestion date format DD/MM/YYYY ou DD-MM-YYYY
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(dateStr)) {
      const parts = dateStr.split(/[\/\-\.]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    
    // Gestion date format YYYY/MM/DD ou YYYY-MM-DD
    if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split(/[\/\-\.]/);
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    
    // Format Excel (nombre de jours depuis 1900-01-01)
    if (/^\d+$/.test(dateStr)) {
      const days = parseInt(dateStr);
      if (days > 1000 && days < 50000) {  // Valeurs raisonnables pour des dates Excel
        // Correction pour le bug Excel: Excel considère que 1900 est une année bissextile
        const excelEpoch = new Date(1899, 11, 30);
        const msPerDay = 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + days * msPerDay);
        return date.toISOString().split('T')[0];
      }
    }
    
    // Essayer de parser directement la date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error("Date parsing error:", e);
  }
  
  // Valeur par défaut
  return new Date().toISOString().split('T')[0];
}

function handleImportResults(campaigns: Partial<Campaign>[], totalRows: number, errors: string[]) {
  if (errors.length > 0) {
    toast.warning(`${errors.length} erreur(s) lors de l'import. Vérifiez la console pour plus de détails.`);
    console.error("Erreurs d'import:", errors);
  }
  
  if (campaigns.length === 0) {
    toast.error("Aucune campagne valide n'a pu être importée");
  } else if (campaigns.length < totalRows) {
    toast.warning(`${campaigns.length} campagnes importées sur ${totalRows - 1} lignes`);
  } else {
    toast.success(`${campaigns.length} campagnes importées avec succès`);
  }
}
