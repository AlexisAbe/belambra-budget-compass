
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetResponse {
  values: any[][];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spreadsheetId, range } = await req.json();
    const SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');

    if (!spreadsheetId || !range) {
      throw new Error('Spreadsheet ID and range are required');
    }

    // Vérification plus stricte de la clé API
    if (!SHEETS_API_KEY || SHEETS_API_KEY.trim() === '') {
      console.error('Google Sheets API Key is missing or empty');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error: Google Sheets API Key is not configured correctly',
          errorType: 'ConfigurationError'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching data from spreadsheet: ${spreadsheetId}, range: ${range}`);

    // Make sure the sheet is accessible to "anyone with the link" or "public"
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${SHEETS_API_KEY}`;
    console.log(`API URL: ${url.replace(SHEETS_API_KEY, 'API_KEY_HIDDEN')}`); // Masquer la clé dans les logs

    const response = await fetch(url);
    const responseStatus = response.status;
    const responseStatusText = response.statusText;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Sheets API error: ${responseStatus} ${responseStatusText}, Details: ${errorText}`);
      
      // Messages d'erreur personnalisés selon le code d'erreur
      let userMessage = `Google Sheets API error: Status ${responseStatus} - ${responseStatusText}`;
      
      if (responseStatus === 403) {
        userMessage = "Accès refusé au Google Sheet. Assurez-vous que le document est partagé avec 'Quiconque ayant le lien' peut le consulter.";
      } else if (responseStatus === 404) {
        userMessage = "Google Sheet introuvable. Vérifiez l'URL et assurez-vous que le document existe.";
      } else if (responseStatus === 400 && errorText.includes("API_KEY_INVALID")) {
        userMessage = "La clé API Google Sheets n'est pas valide. Veuillez contacter l'administrateur.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          errorType: 'APIError',
          status: responseStatus
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data: SheetResponse = await response.json();
    
    if (!data.values || data.values.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No data found in the specified range',
          errorType: 'NoDataError'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${data.values.length} rows of data (including header)`);
    
    // Process the data to match our campaign format
    const [headers, ...rows] = data.values;
    
    console.log('Headers:', headers);
    console.log(`Processing ${rows.length} data rows`);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Aucune donnée trouvée dans la feuille (seulement des en-têtes)',
          errorType: 'EmptyDataError'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const processedData = rows.map((row, index) => {
      const campaign: Record<string, any> = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      headers.forEach((header: string, idx: number) => {
        // Handle common field mapping issues
        let fieldName = header.trim();
        
        // Map French column names to our expected field names if needed
        const fieldMappings: Record<string, string> = {
          "Levier Média": "mediaChannel",
          "Média": "mediaChannel",
          "Media": "mediaChannel",
          "Levier": "mediaChannel",
          "Nom Campagne": "campaignName",
          "Nom de la Campagne": "campaignName",
          "Campagne": "campaignName",
          "Objectif Marketing": "marketingObjective",
          "Objectif": "marketingObjective",
          "Cible": "targetAudience",
          "Audience": "targetAudience",
          "Cible/Audience": "targetAudience",
          "Date de début": "startDate",
          "Date Début": "startDate",
          "Budget Total": "totalBudget",
          "Budget": "totalBudget",
          "Durée (jours)": "durationDays",
          "Durée": "durationDays",
          "Statut": "status",
          "État": "status"
        };
        
        if (fieldName in fieldMappings) {
          fieldName = fieldMappings[fieldName];
        }
        
        // Handle empty or missing values
        const value = row[idx] !== undefined ? row[idx] : '';
        campaign[fieldName] = value;
      });
      
      // Add required fields if missing
      if (!campaign.mediaChannel) campaign.mediaChannel = "OTHER";
      if (!campaign.campaignName) campaign.campaignName = `Imported Campaign ${index + 1}`;
      if (!campaign.marketingObjective) campaign.marketingObjective = "OTHER";
      if (!campaign.targetAudience) campaign.targetAudience = "Audience générale";
      if (!campaign.startDate) campaign.startDate = new Date().toISOString().split('T')[0];
      if (!campaign.totalBudget) campaign.totalBudget = 0;
      if (!campaign.durationDays) campaign.durationDays = 30;
      if (!campaign.status) campaign.status = "ACTIVE";
      
      // Initialize empty budget objects
      campaign.weeklyBudgetPercentages = {};
      campaign.weeklyBudgets = {};
      campaign.weeklyActuals = {};
      
      return campaign;
    });

    console.log(`Successfully processed ${processedData.length} campaigns`);
    
    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      errorType: error.name || 'Error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
