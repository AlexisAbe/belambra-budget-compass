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
 * Parse CSV string data into array of campaigns with detailed validation
 */
export function parseCSVData(csvData: string): Partial<Campaign>[] {
  const rows = csvData.split('\n');
  if (rows.length < 2) {
    toast.error("Le fichier CSV doit contenir au moins un en-tête et une ligne de données");
    return [];
  }

  const headers = rows[0].split(',').map(header => header.trim());
  console.log("Colonnes CSV détectées:", headers);
  
  // Recherche des colonnes requises avec différentes variations possibles
  const findColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };
  
  const columnIndices = {
    mediaChannel: findColumnIndex(['media', 'levier', 'channel']),
    campaignName: findColumnIndex(['campagne', 'campaign', 'nom']),
    objective: findColumnIndex(['objectif', 'objective']),
    audience: findColumnIndex(['cible', 'audience', 'target']),
    startDate: findColumnIndex(['début', 'debut', 'start', 'date']),
    totalBudget: findColumnIndex(['budget total', 'total budget', 'budget']),
    duration: findColumnIndex(['durée', 'duree', 'duration', 'jours', 'days'])
  };

  // Vérification des colonnes requises
  const missingColumns = Object.entries(columnIndices)
    .filter(([_, index]) => index === -1)
    .map(([name]) => name);

  if (missingColumns.length > 0) {
    toast.error(`Colonnes manquantes: ${missingColumns.join(', ')}`);
    return [];
  }

  console.log("Indices des colonnes trouvés:", columnIndices);
  
  // Recherche des colonnes de semaines
  const weekIndices: Record<string, number> = {};
  headers.forEach((header, index) => {
    const headerLower = header.toLowerCase().trim();
    
    // Vérification plus stricte des formats de semaines
    const weekFormats = [
      /^s\s*(\d+)(?:\s*\(%\))?$/i,
      /^s(?:emaine)?\s*(\d+)(?:\s*\(%\))?$/i,
      /^w(?:eek)?\s*(\d+)(?:\s*\(%\))?$/i
    ];

    for (const format of weekFormats) {
      const match = headerLower.match(format);
      if (match) {
        const weekNum = parseInt(match[1]);
        if (weekNum >= 1 && weekNum <= 52) {
          const weekKey = `S${weekNum}`;
          weekIndices[weekKey] = index;
          console.log(`Colonne semaine trouvée: ${header} à l'index ${index}, mappé à ${weekKey}`);
          break;
        }
      }
    }
  });
  
  if (Object.keys(weekIndices).length === 0) {
    toast.warning("Aucune colonne de semaine (S1-S52) trouvée dans le fichier");
  }
  
  // Traitement des lignes de données
  const campaigns: Partial<Campaign>[] = [];
  const errors: string[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue; // Ignorer les lignes vides
    
    const columns = rows[i].split(',').map(col => col.trim());
    
    if (columns.length < 3) {
      console.warn(`Ligne ${i + 1} ignorée - nombre insuffisant de colonnes:`, columns);
      continue;
    }
    
    // Validation et nettoyage du budget
    const totalBudgetRaw = columnIndices.totalBudget >= 0 ? columns[columnIndices.totalBudget] || "0" : "0";
    const cleanBudget = totalBudgetRaw.replace(/[^\d.,]/g, '').replace(',', '.');
    const totalBudget = parseFloat(cleanBudget) || 0;
    
    console.log(`Ligne ${i + 1} - budget brut: "${totalBudgetRaw}", nettoyé: "${cleanBudget}", parsé: ${totalBudget}`);
    
    // Initialisation des données hebdomadaires
    const weeklyBudgetPercentages: Record<string, number> = {};
    const weeklyBudgets: Record<string, number> = {};
    const weeklyActuals: Record<string, number> = {};
    let totalPercentage = 0;
    
    // Traitement des pourcentages hebdomadaires
    Object.entries(weekIndices).forEach(([week, index]) => {
      if (index < columns.length) {
        let percentValue = columns[index] || "0";
        percentValue = typeof percentValue === 'string' ? 
          percentValue.replace(/[%\s]/g, '').replace(',', '.') : "0";
        if (percentValue === "") percentValue = "0";
        
        const percentage = parseFloat(percentValue) || 0;
        weeklyBudgetPercentages[week] = percentage;
        totalPercentage += percentage;
        
        const weeklyBudget = (percentage / 100) * totalBudget;
        weeklyBudgets[week] = weeklyBudget;
        
        console.log(`Ligne ${i + 1}, Semaine ${week}: ${percentage}% de ${totalBudget} = ${weeklyBudget}`);
      } else {
        weeklyBudgetPercentages[week] = 0;
        weeklyBudgets[week] = 0;
      }
      weeklyActuals[week] = 0;
    });
    
    // Validation du total des pourcentages
    if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 1) {
      console.warn(`Ligne ${i + 1}: Total des pourcentages (${totalPercentage}%) différent de 100%. Normalisation appliquée.`);
      Object.keys(weeklyBudgetPercentages).forEach(week => {
        weeklyBudgetPercentages[week] = (weeklyBudgetPercentages[week] / totalPercentage) * 100;
      });
    }
    
    // Si aucune donnée hebdomadaire n'a été trouvée, initialiser avec des zéros
    if (Object.keys(weeklyBudgetPercentages).length === 0) {
      weeks.forEach(week => {
        weeklyBudgetPercentages[week] = 0;
        weeklyBudgets[week] = 0;
        weeklyActuals[week] = 0;
      });
    }
    
    // Traitement et validation de la date
    let startDate = "2025-01-01";
    if (columnIndices.startDate >= 0 && columns[columnIndices.startDate]) {
      try {
        const dateStr = columns[columnIndices.startDate];
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          startDate = dateStr;
        }
        else if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(dateStr)) {
          const parts = dateStr.split(/[\/\-\.]/);
          startDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        else {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            startDate = date.toISOString().split('T')[0];
          } else {
            console.warn(`Ligne ${i + 1}: Format de date invalide, utilisation de la date par défaut`);
          }
        }
      } catch (e) {
        console.error(`Ligne ${i + 1}: Erreur de parsing de la date:`, e);
        errors.push(`Ligne ${i + 1}: Format de date invalide`);
      }
    }
    
    // Création de l'objet campagne
    const campaign: Partial<Campaign> = {
      id: `imported-${Date.now()}-${i}`,
      mediaChannel: columns[columnIndices.mediaChannel] || "OTHER",
      campaignName: columns[columnIndices.campaignName] || `Campagne importée ${i + 1}`,
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
    
    console.log(`Campagne créée à partir de la ligne ${i + 1}:`, campaign.campaignName);
    campaigns.push(campaign);
  }
  
  // Affichage des erreurs s'il y en a
  if (errors.length > 0) {
    toast.warning(`${errors.length} erreur(s) lors de l'import. Vérifiez la console pour plus de détails.`);
    console.error("Erreurs d'import:", errors);
  }
  
  // Résumé de l'import
  console.log(`Import terminé: ${campaigns.length} campagnes valides sur ${rows.length - 1} lignes`);
  if (campaigns.length === 0) {
    toast.error("Aucune campagne valide n'a pu être importée");
  } else if (campaigns.length < rows.length - 1) {
    toast.warning(`${campaigns.length} campagnes importées sur ${rows.length - 1} lignes`);
  } else {
    toast.success(`${campaigns.length} campagnes importées avec succès`);
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
