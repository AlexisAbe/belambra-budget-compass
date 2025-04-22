
import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, X, Download, Pencil } from "lucide-react";
import { processImportFile } from "@/lib/import/importHandler";
import { validateImportFile } from "@/lib/import/validateImport";
import { downloadTemplate } from "@/lib/templateUtils";
import { toast } from "sonner";
import { Campaign } from "@/types";
import DataTable from "@/components/DataTable";

type ImportDataProps = {
  onClose: () => void;
};

const ImportData: React.FC<ImportDataProps> = ({ onClose }) => {
  const { setCampaigns } = useCampaigns();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  
  const handleImport = async (file: File) => {
    if (!validateImportFile(file)) return;
    
    setIsUploading(true);
    
    try {
      let importedCampaigns = await processImportFile(file);
      
      if (!importedCampaigns || importedCampaigns.length === 0) {
        toast.error("Aucune campagne trouvée dans le fichier importé");
        return;
      }
      
      handleImportCampaigns(importedCampaigns);
    } catch (error) {
      console.error("Error processing import file:", error);
      toast.error(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Vérifiez le format du fichier'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportCampaigns = (importedCampaigns: Partial<Campaign>[]) => {
    setCampaigns(prevCampaigns => {
      const existingCampaignNames = new Set(prevCampaigns.map(c => `${c.mediaChannel}-${c.campaignName}`.toLowerCase()));
      const newCampaigns = importedCampaigns.filter(
        campaign => !existingCampaignNames.has(`${campaign.mediaChannel}-${campaign.campaignName}`.toLowerCase())
      );
      
      if (newCampaigns.length === 0) {
        toast.warning("Toutes les campagnes du fichier existent déjà");
        return prevCampaigns;
      }
      
      const fullNewCampaigns: Campaign[] = newCampaigns.map(campaign => ({
        id: campaign.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        mediaChannel: campaign.mediaChannel || "OTHER",
        campaignName: campaign.campaignName || `Campagne importée ${Date.now()}`,
        marketingObjective: campaign.marketingObjective || "OTHER",
        targetAudience: campaign.targetAudience || "Audience générale",
        startDate: campaign.startDate || new Date().toISOString().substring(0, 10),
        totalBudget: campaign.totalBudget || 0,
        durationDays: campaign.durationDays || 30,
        status: campaign.status || "ACTIVE",
        weeklyBudgetPercentages: campaign.weeklyBudgetPercentages || {},
        weeklyBudgets: campaign.weeklyBudgets || {},
        weeklyActuals: campaign.weeklyActuals || {}
      }));
      
      toast.success(`${fullNewCampaigns.length} nouvelles campagnes importées`);
      return [...prevCampaigns, ...fullNewCampaigns];
    });
    
    onClose();
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

  if (showDataTable) {
    return (
      <DataTable 
        onImport={handleImportCampaigns}
        onCancel={() => setShowDataTable(false)}
      />
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Importer des données</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Suppression du bloc GoogleSheetsImport */}

        <div className="border-t border-gray-200 my-4"></div>

        <Button
          onClick={() => setShowDataTable(true)}
          className="w-full flex items-center justify-center gap-2"
          variant="outline"
        >
          <Pencil className="h-4 w-4" />
          Saisir ou coller des données manuellement
        </Button>

        <div className="border-t border-gray-200 my-4"></div>

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
          <p>Pour le CSV, les séparateurs acceptés sont la virgule (,) ou le point-virgule (;)</p>
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
      </div>
    </div>
  );
};

export default ImportData;
