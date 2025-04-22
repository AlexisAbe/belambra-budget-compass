
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
    console.log("Function invoked with method:", req.method);
    
    // Parse request body as JSON
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", JSON.stringify(requestBody));
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: jsonError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { spreadsheetId, range } = requestBody;
    const SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    
    console.log(`Using Spreadsheet ID: ${spreadsheetId}`);
    console.log(`Using Range: ${range}`);
    console.log(`API Key exists: ${!!SHEETS_API_KEY}`);
    console.log(`API Key length: ${SHEETS_API_KEY ? SHEETS_API_KEY.length : 0}`);
    
    // Enhanced validation with more detailed logging
    if (!spreadsheetId) {
      console.error('Validation Error: Spreadsheet ID is missing');
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
      console.error('Validation Error: Range is missing');
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
      console.error('Configuration Error: Google Sheets API Key is missing or empty');
      return new Response(
        JSON.stringify({ 
          error: 'Google Sheets API Key is not configured',
          errorType: 'ConfigurationError',
          details: 'Please set up the GOOGLE_SHEETS_API_KEY in Supabase Edge Function Secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${SHEETS_API_KEY}`;
    console.log(`Making request to Google Sheets API: ${url.replace(SHEETS_API_KEY, "API_KEY_HIDDEN")}`);
    
    // Add request options with timeout
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    };
    
    console.log(`Sending request to Google Sheets API...`);
    const response = await fetch(url, requestOptions);
    
    // Detailed logging of response
    console.log(`Google Sheets API response status: ${response.status}`);
    console.log(`Google Sheets API response status text: ${response.statusText}`);
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error(`Google Sheets API error details: ${errorText}`);
      } catch (textError) {
        console.error(`Failed to extract error text: ${textError.message}`);
        errorText = "Could not extract error details";
      }
      
      // More detailed error handling
      let userMessage = `Google Sheets API error: Status ${response.status}`;
      let errorDetails = errorText;
      
      try {
        // Try to parse error as JSON for more details
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorDetails = errorJson.error.message;
          console.error(`Parsed error message: ${errorDetails}`);
          
          // Check for specific error messages
          if (errorDetails.includes('API key not valid')) {
            userMessage = "La clé API Google Sheets n'est pas valide.";
          } else if (errorDetails.includes('The caller does not have permission')) {
            userMessage = "Le document n'est pas accessible. Vérifiez les permissions de partage.";
          } else if (errorDetails.includes('not found')) {
            userMessage = "Feuille de calcul non trouvée. Vérifiez l'URL et que la feuille 'Sheet1' existe.";
          } else if (errorDetails.includes('Invalid sheet name')) {
            userMessage = "Nom de feuille invalide. Assurez-vous que votre feuille s'appelle 'Sheet1'.";
          } else if (errorDetails.includes('Unable to parse range')) {
            userMessage = "Plage non valide. Format attendu: 'Sheet1!A1:Z1000'.";
          }
        }
      } catch (parseError) {
        console.log(`Error text is not JSON: ${parseError.message}`);
      }
      
      // Add status-specific error messages
      switch (response.status) {
        case 403:
          userMessage = "Accès refusé. Vérifiez que le document est partagé publiquement et que la clé API est valide.";
          break;
        case 404:
          userMessage = "Feuille de calcul ou onglet introuvable. Vérifiez l'URL et que la feuille 'Sheet1' existe.";
          break;
        case 400:
          userMessage = "Requête invalide. Vérifiez l'URL et les paramètres.";
          break;
      }

      console.error(`Returning error to client: ${userMessage}`);
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          errorType: 'APIError',
          status: response.status,
          details: errorDetails
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let data: SheetResponse;
    try {
      data = await response.json();
      console.log(`Successfully parsed response JSON. Data format valid:`, !!data.values);
      console.log(`Number of rows in data: ${data.values ? data.values.length : 0}`);
    } catch (jsonError) {
      console.error(`Failed to parse response as JSON: ${jsonError.message}`);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors du traitement des données: format de réponse invalide',
          errorType: 'ParseError'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!data.values || data.values.length === 0) {
      console.warn('No data found in the specified range');
      return new Response(
        JSON.stringify({ 
          error: 'Aucune donnée trouvée dans la plage spécifiée. Vérifiez que votre feuille contient des données.',
          errorType: 'NoDataError'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Data found in range. Rows: ${data.values.length}, First row length: ${data.values[0].length}`);
    
    // Check if there's only one row (which would be just headers)
    if (data.values.length === 1) {
      console.warn('Only headers found in the sheet, no data rows');
      return new Response(
        JSON.stringify({ 
          error: 'Seule la ligne d\'en-tête a été trouvée. Aucune donnée n\'est présente dans la feuille.',
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
    
    console.log(`Headers: ${JSON.stringify(headers)}`);
    if (rows.length > 0) {
      console.log(`First row data: ${JSON.stringify(rows[0])}`);
    }
    
    const processedData = rows.map((row, index) => {
      const campaign: Record<string, any> = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      headers.forEach((header: string, idx: number) => {
        let fieldName = header ? header.toString().trim() : '';
        
        // Vérifier si l'en-tête est vide ou invalide
        if (!fieldName) {
          console.warn(`Empty header found at index ${idx}, skipping this column`);
          return; // Skip this column
        }
        
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
        
        // Gérer les valeurs null ou undefined
        let value = undefined;
        if (idx < row.length) {
          value = row[idx] !== undefined ? row[idx] : '';
        } else {
          value = '';
        }
        
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
    console.error(`Unexpected error in function: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    
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
