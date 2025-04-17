
import { mediaChannels, marketingObjectives, Campaign } from "@/types";
import { weeks } from "@/services/mockData";

/**
 * Creates a CSV template for campaign data import
 */
export function generateCsvTemplate(): string {
  // Header row with basic campaign info
  const basicColumns = [
    "Levier Média", 
    "Nom Campagne", 
    "Objectif Marketing", 
    "Cible/Audience", 
    "Date Début", 
    "Budget Total", 
    "Durée (jours)"
  ];
  
  // Add week columns (S1-S52)
  const weekColumns = weeks.map(week => week);
  
  // Combine all header columns
  const headerRow = [...basicColumns, ...weekColumns].join(',');
  
  // Generate 1-2 example rows
  const exampleRows = [
    [
      "META",
      "Exemple Campagne Été",
      "CONVERSION",
      "Familles avec enfants",
      "2025-04-01",
      "85000",
      "90"
    ].join(','),
    [
      "GOOGLE",
      "Exemple Search Hiver",
      "CONSIDERATION",
      "CSP+ 35-55 ans",
      "2025-01-15",
      "50000",
      "60"
    ].join(',')
  ];
  
  // Combine header and example rows
  return [headerRow, ...exampleRows].join('\n');
}

/**
 * Generates a JSON template for campaign data import
 */
export function generateJsonTemplate(): string {
  // Create empty weekly budgets object
  const weeklyBudgets: Record<string, number> = {};
  const weeklyActuals: Record<string, number> = {};
  
  // Initialize with zeros
  weeks.forEach(week => {
    weeklyBudgets[week] = 0;
    weeklyActuals[week] = 0;
  });
  
  // Set some example values
  weeklyBudgets.S1 = 5000;
  weeklyBudgets.S2 = 7500;
  weeklyBudgets.S3 = 10000;
  
  // Example campaign data
  const exampleCampaigns: Partial<Campaign>[] = [
    {
      mediaChannel: "META",
      campaignName: "Exemple Campagne Été",
      marketingObjective: "CONVERSION",
      targetAudience: "Familles avec enfants",
      startDate: "2025-04-01",
      totalBudget: 85000,
      durationDays: 90,
      weeklyBudgets,
      weeklyActuals
    },
    {
      mediaChannel: "GOOGLE",
      campaignName: "Exemple Search Hiver",
      marketingObjective: "CONSIDERATION",
      targetAudience: "CSP+ 35-55 ans",
      startDate: "2025-01-15",
      totalBudget: 50000,
      durationDays: 60,
      weeklyBudgets: { ...weeklyBudgets },
      weeklyActuals: { ...weeklyActuals }
    }
  ];
  
  return JSON.stringify(exampleCampaigns, null, 2);
}

/**
 * Triggers a download of the template file
 */
export function downloadTemplate(format: 'csv' | 'json'): void {
  let content: string;
  let filename: string;
  let mimeType: string;
  
  if (format === 'csv') {
    content = generateCsvTemplate();
    filename = 'campagnes_template.csv';
    mimeType = 'text/csv';
  } else {
    content = generateJsonTemplate();
    filename = 'campagnes_template.json';
    mimeType = 'application/json';
  }
  
  // Create a blob and download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Create download link and trigger click
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
