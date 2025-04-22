
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle, HelpCircle, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GoogleSheetsImportProps {
  onImportSuccess: (data: any[]) => void;
}

const GoogleSheetsImport: React.FC<GoogleSheetsImportProps> = ({ onImportSuccess }) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const extractSpreadsheetId = (url: string): string | null => {
    // Handle different Google Sheet URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,        // Standard format
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,  // Edit URL
      /^([a-zA-Z0-9-_]{25,})/                       // Just the ID
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
      setDetailedError(null);
      
      // Log the URL for debugging
      console.log("URL saisie:", spreadsheetUrl);
      
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl.trim());
      
      if (!spreadsheetId) {
        setError("URL de Google Sheets invalide. Assurez-vous de copier l'URL complète du document.");
        setIsLoading(false);
        return;
      }

      console.log(`Tentative d'importation de Google Sheet avec ID: ${spreadsheetId}`);
      
      // Specify Sheet1 and a large range to cover most use cases
      const range = 'Sheet1!A1:Z1000';
      console.log(`Utilisation de la plage: ${range}`);
      
      const { data: responseData, error: functionError } = await supabase.functions.invoke('google-sheets', {
        body: {
          spreadsheetId,
          range
        }
      });

      if (functionError) {
        console.error('Erreur de fonction:', functionError);
        setError(`Erreur de la fonction: ${functionError.message || 'Erreur inconnue'}`);
        setIsLoading(false);
        return;
      }

      console.log('Réponse complète de la fonction:', responseData);

      if (!responseData) {
        setError("Aucune réponse n'a été retournée par la fonction. Vérifiez les logs de la fonction pour plus de détails.");
        setIsLoading(false);
        return;
      }

      if (responseData.error) {
        console.error('Erreur API:', responseData.error);
        console.error('Détails:', responseData.details);
        
        // Créer un message d'erreur plus convivial basé sur la réponse
        let userMessage = responseData.error;
        
        // Ajoutez des conseils utiles basés sur l'erreur
        if (responseData.status === 403) {
          userMessage = "Accès refusé. Assurez-vous que votre feuille est partagée avec le paramètre 'Toute personne avec le lien peut voir'.";
        } else if (responseData.status === 404) {
          userMessage = "Feuille introuvable. Vérifiez que l'URL est correcte et que la feuille 'Sheet1' existe.";
        } else if (responseData.error.includes("API key")) {
          userMessage = "Problème de clé API. Vérifiez que la clé Google Sheets API est correctement configurée dans les secrets Supabase.";
        }
        
        setError(userMessage);
        setDetailedError(responseData.details);
        setIsLoading(false);
        return;
      }

      if (!responseData.data || responseData.data.length === 0) {
        setError("Aucune donnée valide n'a été trouvée dans la feuille. Vérifiez que la feuille contient des données et que la première ligne comporte des en-têtes.");
        setIsLoading(false);
        return;
      }

      console.log('Données importées:', responseData.data);
      
      onImportSuccess(responseData.data);
      toast.success(`${responseData.data.length} campagnes importées avec succès`);
      setSpreadsheetUrl('');
      
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setError(`Erreur lors de l'importation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Importer depuis Google Sheets</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>Assurez-vous que votre feuille est nommée "Sheet1" et contient des en-têtes dans la première ligne. Si vous avez des problèmes, vérifiez que l'API key est configurée correctement dans Supabase.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Instructions importantes</AlertTitle>
        <AlertDescription className="text-sm">
          <p>1. <strong>Partagez</strong> votre Google Sheet avec le paramètre "Toute personne avec le lien peut voir".</p>
          <p>2. <strong>Le nom de votre feuille</strong> DOIT être "Sheet1" (nom par défaut).</p>
          <p>3. <strong>La première ligne</strong> doit contenir des en-têtes avec les noms des colonnes.</p>
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
          <AlertDescription>
            <p>{error}</p>
            {detailedError && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Voir les détails techniques</summary>
                <p className="mt-1 text-xs border-l-2 border-red-300 pl-2">{detailedError}</p>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="border-t pt-3 mt-2">
        <h4 className="text-sm font-medium mb-1">Conseils de dépannage:</h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
          <li>Vérifiez que votre feuille est bien partagée avec "Toute personne avec le lien peut voir"</li>
          <li>Le nom de la feuille DOIT être "Sheet1" (vérifiez l'onglet en bas de votre feuille)</li>
          <li>Assurez-vous que la clé API Google Sheets est correctement configurée dans Supabase</li>
          <li>La feuille doit contenir une ligne d'en-tête avec des noms comme: Levier Média, Nom Campagne, etc.</li>
          <li>
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              Ouvrir la feuille dans un nouvel onglet <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleSheetsImport;
