
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
  
  // Add week columns (S1-S52) for percentage allocation
  const weekColumns = weeks.map(week => `${week} (%)`);
  
  // Combine all header columns
  const headerRow = [...basicColumns, ...weekColumns].join(',');
  
  // Generate example rows with percentage allocation
  const exampleRows = [
    [
      "META",
      "Exemple Campagne Été",
      "CONVERSION",
      "Familles avec enfants",
      "2025-04-01",
      "85000",
      "90",
      // Add percentage values for a few weeks
      ...weeks.map(week => {
        // Just for the example, allocate some percentages to the first few weeks
        if (week === "S14") return "10";
        if (week === "S15") return "15";
        if (week === "S16") return "20";
        if (week === "S17") return "25";
        if (week === "S18") return "20";
        if (week === "S19") return "10";
        return "0";
      })
    ].join(','),
    [
      "GOOGLE",
      "Exemple Search Hiver",
      "CONSIDERATION",
      "CSP+ 35-55 ans",
      "2025-01-15",
      "50000",
      "60",
      // Add percentage values for a few weeks
      ...weeks.map(week => {
        // Just for the example, allocate some percentages to the first few weeks
        if (week === "S3") return "20";
        if (week === "S4") return "30";
        if (week === "S5") return "30";
        if (week === "S6") return "20";
        return "0";
      })
    ].join(',')
  ];
  
  // Combine header and example rows
  return [headerRow, ...exampleRows].join('\n');
}

/**
 * Generates a JSON template for campaign data import
 */
export function generateJsonTemplate(): string {
  // Create empty weekly budgets percentages object
  const weeklyBudgetPercentages: Record<string, number> = {};
  const weeklyActuals: Record<string, number> = {};
  
  // Initialize with zeros
  weeks.forEach(week => {
    weeklyBudgetPercentages[week] = 0;
    weeklyActuals[week] = 0;
  });
  
  // Set some example percentage values that add up to 100%
  weeklyBudgetPercentages.S14 = 10;
  weeklyBudgetPercentages.S15 = 15;
  weeklyBudgetPercentages.S16 = 20;
  weeklyBudgetPercentages.S17 = 25;
  weeklyBudgetPercentages.S18 = 20;
  weeklyBudgetPercentages.S19 = 10;
  
  // Second example for another campaign
  const secondCampaignPercentages = { ...weeklyBudgetPercentages };
  Object.keys(secondCampaignPercentages).forEach(key => {
    secondCampaignPercentages[key] = 0;
  });
  secondCampaignPercentages.S3 = 20;
  secondCampaignPercentages.S4 = 30;
  secondCampaignPercentages.S5 = 30;
  secondCampaignPercentages.S6 = 20;
  
  // Example campaign data with percentages
  const exampleCampaigns: Partial<Campaign>[] = [
    {
      mediaChannel: "META",
      campaignName: "Exemple Campagne Été",
      marketingObjective: "CONVERSION",
      targetAudience: "Familles avec enfants",
      startDate: "2025-04-01",
      totalBudget: 85000,
      durationDays: 90,
      weeklyBudgetPercentages: weeklyBudgetPercentages,
      weeklyBudgets: {}, // This will be calculated based on percentages
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
      weeklyBudgetPercentages: secondCampaignPercentages,
      weeklyBudgets: {}, // This will be calculated based on percentages
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
