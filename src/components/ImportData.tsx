
import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, X, Download } from "lucide-react";
import { validateImportFile, processImportFile } from "@/lib/importUtils";
import { downloadTemplate } from "@/lib/templateUtils";
import { toast } from "sonner";
import Papa from "papaparse"; // Ensure this import is correct
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
        complete: (results) => {
          const campaigns: Partial<Campaign>[] = results.data.map((row: any) => {
            const weeklyBudgets: Record<string, number> = {};
            const weeklyActuals: Record<string, number> = {};
            const weeklyBudgetPercentages: Record<string, number> = {};
            
            Object.keys(row).forEach(key => {
              if (key.match(/^S\d+$/)) {
                const percentage = parseFloat(row[key]) || 0;
                weeklyBudgetPercentages[key] = percentage;
                
                const budget = (percentage / 100) * parseFloat(row.totalBudget || "0");
                weeklyBudgets[key] = budget;
                weeklyActuals[key] = 0;
              }
            });

            return {
              id: `imported-${Date.now()}-${Math.random()}`,
              mediaChannel: row.mediaChannel || "OTHER",
              campaignName: row.campaignName || "Campagne importée",
              marketingObjective: row.marketingObjective || "OTHER",
              targetAudience: row.targetAudience || "Audience générale",
              startDate: row.startDate || "2025-01-01",
              totalBudget: parseFloat(row.totalBudget) || 0,
              durationDays: parseInt(row.durationDays) || 30,
              status: "ACTIVE" as const,
              weeklyBudgetPercentages,
              weeklyBudgets,
              weeklyActuals
            };
          });
          
          resolve(campaigns);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };
  
  const handleImport = async (file: File) => {
    if (!validateImportFile(file)) return;
    
    setIsUploading(true);
    
    try {
      let importedCampaigns;
      
      if (file.name.endsWith('.csv')) {
        importedCampaigns = await processCSV(file);
      } else if (file.name.endsWith('.json')) {
        importedCampaigns = await processImportFile(file);
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
      toast.error("Erreur lors de l'import. Vérifiez le format du fichier.");
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
              Parcourir les fichiers
            </Button>
          </label>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>Formats supportés: CSV, JSON</p>
          <p>Taille maximale: 5MB</p>
          <p>Les colonnes doivent inclure: nom de campagne, levier média, objectif, etc.</p>
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
