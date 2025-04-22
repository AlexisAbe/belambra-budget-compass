
import { toast } from "sonner";

export function validateImportFile(file: File): boolean {
  const validExtensions = ['.csv', '.json', '.xlsx', '.xls'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    toast.error(`Format de fichier non supporté. Utilisez CSV, JSON ou Excel.`);
    return false;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    toast.error(`Fichier trop volumineux. Maximum 5MB.`);
    return false;
  }
  
  return true;
}

export function validateCSVHeaders(headers: string[]): { 
  columnIndices: Record<string, number>,
  weekIndices: Record<string, number>,
  missingColumns: string[] 
} {
  // Recherche des colonnes requises avec différentes variations possibles
  const findColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };
  
  const columnIndices = {
    mediaChannel: findColumnIndex(['media', 'levier', 'channel']),
    campaignName: findColumnIndex(['campagne', 'campaign', 'nom']),
    objective: findColumnIndex(['objectif', 'objective']),
    audience: findColumnIndex(['cible', 'audience', 'target']),
    startDate: findColumnIndex(['début', 'debut', 'start', 'date']),
    totalBudget: findColumnIndex(['budget total', 'total budget', 'budget']),
    duration: findColumnIndex(['durée', 'duree', 'duration', 'jours', 'days'])
  };

  const missingColumns = Object.entries(columnIndices)
    .filter(([_, index]) => index === -1)
    .map(([name]) => name);

  // Recherche des colonnes de semaines
  const weekIndices: Record<string, number> = {};
  headers.forEach((header, index) => {
    const headerLower = header.toLowerCase().trim();
    
    const weekFormats = [
      /^s\s*(\d+)(?:\s*\(%\))?$/i,
      /^s(?:emaine)?\s*(\d+)(?:\s*\(%\))?$/i,
      /^w(?:eek)?\s*(\d+)(?:\s*\(%\))?$/i
    ];

    for (const format of weekFormats) {
      const match = headerLower.match(format);
      if (match) {
        const weekNum = parseInt(match[1]);
        if (weekNum >= 1 && weekNum <= 52) {
          const weekKey = `S${weekNum}`;
          weekIndices[weekKey] = index;
          console.log(`Colonne semaine trouvée: ${header} à l'index ${index}, mappé à ${weekKey}`);
          break;
        }
      }
    }
  });

  return { columnIndices, weekIndices, missingColumns };
}
