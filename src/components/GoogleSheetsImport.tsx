
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";

interface GoogleSheetsImportProps {
  onImportSuccess: (data: any[]) => void;
}

const GoogleSheetsImport: React.FC<GoogleSheetsImportProps> = ({ onImportSuccess }) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSpreadsheetId = (url: string): string | null => {
    // Handle different Google Sheet URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,        // Standard format
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,  // Edit URL
      /^([a-zA-Z0-9-_]{25,})/                      // Just the ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl.trim());
      
      if (!spreadsheetId) {
        setError("URL de Google Sheets invalide. Assurez-vous de copier l'URL complète du document.");
        return;
      }

      console.log(`Importing Google Sheet with ID: ${spreadsheetId}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('google-sheets', {
        body: {
          spreadsheetId,
          range: 'Sheet1!A1:Z1000' // Specify the sheet name explicitly
        }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        setError(`Erreur de la fonction: ${functionError.message || 'Erreur inconnue'}`);
        return;
      }

      if (!data) {
        setError("Aucune donnée n'a été retournée. Vérifiez que votre feuille est accessible et qu'elle contient des données.");
        return;
      }

      if (data.error) {
        console.error('API error:', data.error);
        setError(data.error);
        return;
      }

      if (!data.data || data.data.length === 0) {
        setError("Aucune donnée valide n'a été trouvée dans la feuille. Vérifiez le format des données.");
        return;
      }

      console.log('Imported data:', data.data);
      
      onImportSuccess(data.data);
      toast.success(`${data.data.length} campagnes importées avec succès`);
      setSpreadsheetUrl('');
      
    } catch (error) {
      console.error('Import error:', error);
      setError(`Erreur lors de l'importation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Importer depuis Google Sheets</h3>
      
      <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Instructions</AlertTitle>
        <AlertDescription className="text-sm">
          <p>1. <strong>Partagez</strong> votre Google Sheet avec le paramètre "Toute personne avec le lien peut voir".</p>
          <p>2. Votre feuille doit contenir une ligne d'en-tête avec les noms des colonnes (ex: Levier Média, Nom Campagne, etc.)</p>
          <p>3. Par défaut, nous utilisons la feuille "Sheet1". Contactez-nous si vous utilisez un nom différent.</p>
          <p>4. Collez l'URL complète du Google Sheet ci-dessous.</p>
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="URL du Google Sheet (ex: https://docs.google.com/spreadsheets/d/...)"
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
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur d'importation</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <p className="text-sm text-gray-500">
        Format attendu: colonnes correspondant aux champs de campagne (Levier Média, Nom Campagne, etc.)
      </p>
    </div>
  );
};

export default GoogleSheetsImport;
