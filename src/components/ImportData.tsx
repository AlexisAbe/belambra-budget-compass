
import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, X, Download } from "lucide-react";
import { validateImportFile, processImportFile } from "@/lib/importUtils";
import { downloadTemplate } from "@/lib/templateUtils";
import { toast } from "sonner";
import Papa from "papaparse";
import { Campaign } from "@/types";

type ImportDataProps = {
  onClose: () => void;
};

const ImportData: React.FC<ImportDataProps> = ({ onClose }) => {
  const { setCampaigns } = useCampaigns();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const processCSV = (file: File) => {
    return new Promise<Partial<Campaign>[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          return header.trim().replace(/\s+/g, '_').toLowerCase();
        },
        complete: (results) => {
          console.log("CSV Parse Results:", results);
          
          if (results.errors && results.errors.length > 0) {
            console.error("CSV Parse Errors:", results.errors);
            reject(new Error(`Erreur d'analyse CSV: ${results.errors[0].message}`));
            return;
          }
          
          try {
            const campaigns: Partial<Campaign>[] = results.data.map((row: any, index: number) => {
              console.log(`Processing row ${index}:`, row);
              
              const mediaChannel = row.levier_media || row.media_channel || row.levier_média || "OTHER";
              const campaignName = row.nom_campagne || row.campaign_name || `Campagne importée ${index + 1}`;
              const marketingObjective = row.objectif_marketing || row.marketing_objective || "OTHER";
              const targetAudience = row.cible_audience || row.cible || row.audience || row.target_audience || "Audience générale";
              const startDate = formatDate(row.date_début || row.date_debut || row.start_date || "2025-01-01");
              
              // Clean the budget value
              let totalBudgetRaw = row.budget_total || row.total_budget || "0";
              if (typeof totalBudgetRaw === 'string') {
                totalBudgetRaw = totalBudgetRaw.replace(/[^\d.,]/g, '').replace(',', '.');
              }
              const totalBudget = parseFloat(totalBudgetRaw) || 0;
              
              const durationDays = parseInt(row.durée_jours || row.duree_jours || row.duration_days || row.duration || "30") || 30;
              
              const weeklyBudgets: Record<string, number> = {};
              const weeklyActuals: Record<string, number> = {};
              const weeklyBudgetPercentages: Record<string, number> = {};
              
              // Find week columns and process percentages
              Object.keys(row).forEach(key => {
                // Look for various week formats (s1, s01, semaine1, etc.)
                const weekMatch = key.match(/^(?:s|semaine|week)[-_\s]*(\d+)(?:\s*\(?%\)?)?$/i);
                if (weekMatch) {
                  const weekNum = parseInt(weekMatch[1]);
                  const weekKey = `S${weekNum}`;
                  
                  // Handle percentage value - clean it up
                  let percentageValue = row[key];
                  if (typeof percentageValue === 'string') {
                    percentageValue = percentageValue.replace(/[^\d.,]/g, '').replace(',', '.');
                  }
                  const percentage = parseFloat(percentageValue) || 0;
                  
                  weeklyBudgetPercentages[weekKey] = percentage;
                  
                  // Calculate the weekly budget amount based on percentage
                  const budgetAmount = (percentage / 100) * totalBudget;
                  weeklyBudgets[weekKey] = budgetAmount;
                  
                  console.log(`Week ${weekKey}: ${percentage}% of ${totalBudget} = ${budgetAmount}`);
                  
                  weeklyActuals[weekKey] = 0; // Initialize actual value
                }
              });
              
              // If no week data was found, initialize with zeros for all weeks
              if (Object.keys(weeklyBudgetPercentages).length === 0) {
                for (let i = 1; i <= 52; i++) {
                  const weekKey = `S${i}`;
                  weeklyBudgetPercentages[weekKey] = 0;
                  weeklyBudgets[weekKey] = 0;
                  weeklyActuals[weekKey] = 0;
                }
              }
              
              const campaign: Partial<Campaign> = {
                id: `imported-${Date.now()}-${Math.random()}`,
                mediaChannel,
                campaignName,
                marketingObjective,
                targetAudience,
                startDate,
                totalBudget,
                durationDays,
                status: "ACTIVE" as const,
                weeklyBudgetPercentages,
                weeklyBudgets,
                weeklyActuals
              };
              
              console.log("Created campaign:", campaign.campaignName);
              console.log("Weekly budget percentages:", campaign.weeklyBudgetPercentages);
              console.log("Weekly budgets:", campaign.weeklyBudgets);
              
              return campaign;
            });
            
            console.log("Processed campaigns:", campaigns);
            resolve(campaigns);
          } catch (error) {
            console.error("Error processing campaigns:", error);
            reject(error);
          }
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          reject(error);
        }
      });
    });
  };
  
  const formatDate = (dateString: string): string => {
    if (!dateString) return "2025-01-01";
    
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dateString)) {
        const parts = dateString.split(/[\/\-]/);
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Date parsing error:", e);
    }
    
    return "2025-01-01";
  };
  
  const handleImport = async (file: File) => {
    if (!validateImportFile(file)) return;
    
    setIsUploading(true);
    
    try {
      let importedCampaigns;
      
      if (file.name.endsWith('.csv')) {
        importedCampaigns = await processCSV(file);
      } else if (file.name.endsWith('.json')) {
        const fileContent = await file.text();
        importedCampaigns = JSON.parse(fileContent);
      } else {
        throw new Error("Format de fichier non supporté");
      }
      
      if (!importedCampaigns || importedCampaigns.length === 0) {
        toast.error("Aucune campagne trouvée dans le fichier importé");
        return;
      }
      
      setCampaigns(importedCampaigns as Campaign[]);
      toast.success(`${importedCampaigns.length} campagnes importées avec succès`);
      onClose();
    } catch (error) {
      console.error("Error importing campaigns:", error);
      toast.error(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Vérifiez le format du fichier'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const handleDownloadTemplate = (format: 'csv' | 'json') => {
    downloadTemplate(format);
    toast.success(`Modèle ${format.toUpperCase()} téléchargé`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Importer des données</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-belambra-blue bg-belambra-blue/10' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUp className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Déposez votre fichier CSV ou JSON ici
          </p>
          <p className="text-xs text-gray-500 mb-4">
            ou
          </p>
          <Input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button 
              disabled={isUploading}
              className="cursor-pointer"
            >
              {isUploading ? "Importation en cours..." : "Parcourir les fichiers"}
            </Button>
          </label>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>Formats supportés: CSV, JSON</p>
          <p>Taille maximale: 5MB</p>
          <p>Les colonnes attendues incluent: Levier Média, Nom Campagne, Objectif Marketing, Cible/Audience, etc.</p>
          <p>Les colonnes S1-S52 représentent la <strong>ventilation en pourcentage (%)</strong> du budget total</p>
          <p>Pour chaque semaine, indiquez le pourcentage du budget total à allouer</p>
          <p>La somme des pourcentages doit être égale à 100% pour chaque campagne</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-2">Besoin d'un modèle?</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadTemplate('csv')}
              className="flex items-center"
            >
              <Download className="h-3 w-3 mr-1" />
              Modèle CSV
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadTemplate('json')}
              className="flex items-center"
            >
              <Download className="h-3 w-3 mr-1" />
              Modèle JSON
            </Button>
          </div>
        </div>
        
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
