
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

    // Enhanced validation
    if (!spreadsheetId) {
      console.error('Spreadsheet ID is missing');
      return new Response(
        JSON.stringify({ 
          error: 'Spreadsheet ID is required',
          errorType: 'ValidationError'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!range) {
      console.error('Range is missing');
      return new Response(
        JSON.stringify({ 
          error: 'Sheet range is required',
          errorType: 'ValidationError'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // More strict API key validation
    if (!SHEETS_API_KEY || SHEETS_API_KEY.trim() === '') {
      console.error('Google Sheets API Key is missing or empty');
      return new Response(
        JSON.stringify({ 
          error: 'Google Sheets API Key is not configured',
          errorType: 'ConfigurationError'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Attempting to fetch data from spreadsheet: ${spreadsheetId}, range: ${range}`);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${SHEETS_API_KEY}`;
    
    const response = await fetch(url);
    
    // Log full response details for debugging
    console.log(`Response status: ${response.status}, ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Sheets API error details: ${errorText}`);
      
      // More detailed error handling
      let userMessage = `Google Sheets API error: Status ${response.status}`;
      
      switch (response.status) {
        case 403:
          userMessage = "Accès refusé. Vérifiez que le document est partagé publiquement et que la clé API est valide.";
          break;
        case 404:
          userMessage = "Feuille de calcul introuvable. Vérifiez l'URL et l'ID de la feuille.";
          break;
        case 400:
          userMessage = "Requête invalide. Vérifiez l'URL et les paramètres.";
          break;
      }

      return new Response(
        JSON.stringify({ 
          error: userMessage,
          errorType: 'APIError',
          status: response.status,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data: SheetResponse = await response.json();
    
    if (!data.values || data.values.length === 0) {
      console.warn('No data found in the specified range');
      return new Response(
        JSON.stringify({ 
          error: 'Aucune donnée trouvée dans la plage spécifiée',
          errorType: 'NoDataError'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process data as before
    const [headers, ...rows] = data.values;
    
    const processedData = rows.map((row, index) => {
      const campaign: Record<string, any> = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      headers.forEach((header: string, idx: number) => {
        let fieldName = header.trim();
        
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
    console.error('Unexpected error in function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Une erreur inattendue est survenue',
      errorType: 'UnexpectedError',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

