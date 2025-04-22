
import { Campaign } from "@/types";
import { validateImportFile } from "./validateImport";
import { parseCSVData } from "./parseCSV";
import { toast } from "sonner";

export function processImportFile(file: File): Promise<Partial<Campaign>[]> {
  return new Promise((resolve, reject) => {
    if (!validateImportFile(file)) {
      reject(new Error("Validation du fichier échouée"));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          reject(new Error("Échec de lecture du fichier"));
          return;
        }
        
        const fileContent = event.target.result as string;
        
        if (file.name.endsWith('.csv')) {
          const campaigns = parseCSVData(fileContent);
          console.log("Parsed campaigns from CSV:", campaigns);
          resolve(campaigns);
        } 
        else if (file.name.endsWith('.json')) {
          try {
            let campaigns = JSON.parse(fileContent);
            campaigns = Array.isArray(campaigns) ? campaigns : [campaigns];
            console.log("Parsed campaigns from JSON:", campaigns);
            resolve(campaigns);
          } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            reject(new Error("Format JSON invalide"));
          }
        }
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          toast.error("L'import Excel nécessite l'installation d'une librairie supplémentaire");
          reject(new Error("Format Excel non supporté pour l'instant"));
        }
        else {
          reject(new Error("Format de fichier non supporté"));
        }
      } catch (error) {
        console.error("Error processing import file:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Échec de lecture du fichier"));
    };
    
    reader.readAsText(file);
  });
}
