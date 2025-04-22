
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleSheetsImportProps {
  onImportSuccess: (data: any[]) => void;
}

const GoogleSheetsImport: React.FC<GoogleSheetsImportProps> = ({ onImportSuccess }) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      
      if (!spreadsheetId) {
        toast.error("URL de Google Sheets invalide");
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-sheets', {
        body: {
          spreadsheetId,
          range: 'A1:Z1000' // Adjust range as needed
        }
      });

      if (error) throw error;

      if (data?.data) {
        onImportSuccess(data.data);
        toast.success("Données importées avec succès");
        setSpreadsheetUrl('');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Erreur lors de l'importation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Importer depuis Google Sheets</h3>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="URL du Google Sheet"
          value={spreadsheetUrl}
          onChange={(e) => setSpreadsheetUrl(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleImport}
          disabled={!spreadsheetUrl || isLoading}
        >
          {isLoading ? "Importation..." : "Importer"}
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Format attendu: colonnes correspondant aux champs de campagne (Levier Média, Nom Campagne, etc.)
      </p>
    </div>
  );
};

export default GoogleSheetsImport;
