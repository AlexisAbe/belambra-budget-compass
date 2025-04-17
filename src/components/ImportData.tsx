
import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, X } from "lucide-react";
import { validateImportFile, processImportFile } from "@/lib/importUtils";
import { toast } from "sonner";
import { Campaign } from "@/types";

type ImportDataProps = {
  onClose: () => void;
};

const ImportData: React.FC<ImportDataProps> = ({ onClose }) => {
  const { setCampaigns } = useCampaigns();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleImport = async (file: File) => {
    if (!validateImportFile(file)) return;
    
    setIsUploading(true);
    
    try {
      const importedCampaigns = await processImportFile(file);
      
      if (importedCampaigns.length === 0) {
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
          <Button
            as="label"
            htmlFor="file-upload"
            disabled={isUploading}
            className="cursor-pointer"
          >
            Parcourir les fichiers
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>Formats supportés: CSV, JSON</p>
          <p>Taille maximale: 5MB</p>
          <p>Les colonnes doivent inclure: nom de campagne, levier média, objectif, etc.</p>
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
