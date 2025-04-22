
import React, { useState, useRef, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlusCircle, Trash2, Save, FileUp, Download, Copy } from "lucide-react";
import { useCampaigns } from "@/context/CampaignContext";
import { Campaign, mediaChannels, marketingObjectives } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTableProps {
  onImport: (data: Partial<Campaign>[]) => void;
  onCancel: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ onImport, onCancel }) => {
  const [rows, setRows] = useState<Array<Record<string, string>>>([{}]);
  const [headers, setHeaders] = useState<string[]>(['Levier Média', 'Nom Campagne', 'Objectif Marketing', 'Audience Cible', 'Date Début', 'Budget Total']);
  const [pasteContent, setPasteContent] = useState<string>('');
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add a new row
  const addRow = () => {
    setRows([...rows, {}]);
  };

  // Remove a row
  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  // Handle cell value change
  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [header]: value };
    setRows(newRows);
  };

  // Process paste content
  const processPasteContent = () => {
    if (!pasteContent.trim()) {
      toast.error("Veuillez coller du contenu dans la zone de texte");
      return;
    }

    try {
      // Détecter le délimiteur en fonction du contenu
      let delimiter = detectDelimiter(pasteContent);
      console.log(`Délimiteur détecté: "${delimiter}"`);
      
      // Utiliser un parseur plus robuste pour les données TSV/CSV avec des guillemets
      const parsedData = parseDelimitedText(pasteContent, delimiter);
      
      if (parsedData.length === 0) {
        toast.error("Aucune donnée valide trouvée dans le contenu collé");
        return;
      }

      // Déterminer si la première ligne contient des en-têtes
      const useFirstLineAsHeaders = confirm("La première ligne contient-elle des en-têtes de colonnes?");
      
      let newHeaders: string[];
      let dataRows: string[][];
      
      if (useFirstLineAsHeaders) {
        newHeaders = parsedData[0];
        dataRows = parsedData.slice(1);
      } else {
        newHeaders = headers;
        dataRows = parsedData;
      }

      // Traiter les lignes de données
      const newRows = dataRows.map(values => {
        const row: Record<string, string> = {};
        
        newHeaders.forEach((header, index) => {
          // S'assurer que l'index est valide
          if (index < values.length) {
            // Nettoyer les valeurs (supprimer les guillemets externes si présents)
            let value = values[index] || '';
            row[header] = value;
          } else {
            row[header] = '';
          }
        });
        
        return row;
      });

      setHeaders(newHeaders);
      setRows(newRows);
      setShowPasteModal(false);
      setPasteContent('');
      
      toast.success(`${newRows.length} lignes importées avec succès`);
    } catch (error) {
      console.error("Error processing paste content:", error);
      toast.error("Erreur lors du traitement des données collées");
    }
  };

  // Fonction améliorée pour détecter le délimiteur
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    
    // Compter les occurrences de chaque délimiteur potentiel
    const tabs = (firstLine.match(/\t/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    
    // Sélectionner le délimiteur avec le plus d'occurrences
    if (tabs > commas && tabs > semicolons) return '\t';
    if (commas > tabs && commas > semicolons) return ',';
    if (semicolons > tabs && semicolons > commas) return ';';
    
    // Par défaut, utiliser la tabulation (cas courant du copier-coller depuis Excel ou Google Sheets)
    return '\t';
  };

  // Fonction pour parser du texte délimité avec prise en charge des guillemets et sauts de ligne
  const parseDelimitedText = (text: string, delimiter: string): string[][] => {
    const result: string[][] = [];
    const lines = text.split('\n');
    
    let currentRow: string[] = [];
    let insideQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Si la ligne est vide et qu'on n'est pas dans des guillemets, ignorer
      if (line.trim() === '' && !insideQuotes) continue;
      
      // Si on commence une nouvelle ligne et qu'on n'est pas dans des guillemets
      if (!insideQuotes) {
        currentRow = [];
      }
      
      // Traiter chaque caractère de la ligne
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        // Traiter les guillemets
        if (char === '"') {
          // Si on est au début d'une valeur et qu'il s'agit d'un guillemet, marquer le début d'une chaîne entre guillemets
          if (currentValue === '') {
            insideQuotes = !insideQuotes;
          } 
          // Si on a un double guillemet à l'intérieur d'une chaîne entre guillemets, l'ajouter comme un seul guillemet
          else if (j < line.length - 1 && line[j + 1] === '"' && insideQuotes) {
            currentValue += '"';
            j++; // Sauter le prochain guillemet
          } 
          // Sinon, basculer l'état "à l'intérieur des guillemets"
          else {
            insideQuotes = !insideQuotes;
          }
        } 
        // Si on rencontre le délimiteur et qu'on n'est pas dans des guillemets, terminer la valeur
        else if (char === delimiter && !insideQuotes) {
          currentRow.push(currentValue);
          currentValue = '';
        } 
        // Sinon, ajouter le caractère à la valeur courante
        else {
          currentValue += char;
        }
      }
      
      // Si on n'est pas dans des guillemets après avoir traité une ligne
      if (!insideQuotes) {
        // Ajouter la dernière valeur à la ligne
        currentRow.push(currentValue);
        currentValue = '';
        
        // Ajouter la ligne au résultat
        result.push(currentRow);
      } 
      // Si on est toujours dans des guillemets, ajouter un saut de ligne
      else {
        currentValue += '\n';
      }
    }
    
    // S'il reste une ligne en cours (par exemple, après avoir quitté des guillemets)
    if (currentRow.length > 0 && currentValue !== '') {
      currentRow.push(currentValue);
      result.push(currentRow);
    }
    
    return result;
  };

  // Convert table data to campaigns
  const convertToCampaigns = (): Partial<Campaign>[] => {
    return rows.filter(row => {
      // Skip empty rows
      const hasValues = Object.values(row).some(value => value && value.trim() !== '');
      return hasValues;
    }).map((row, index) => {
      // Map headers to campaign fields - amélioré pour gérer différents formats de noms de colonnes
      const getValueByPossibleNames = (possibleNames: string[]): string => {
        for (const name of possibleNames) {
          const headerKey = Object.keys(row).find(key => 
            key.toLowerCase().includes(name.toLowerCase())
          );
          
          if (headerKey && row[headerKey]) {
            return row[headerKey];
          }
        }
        return '';
      };
      
      const mediaChannel = (getValueByPossibleNames(['levier média', 'media', 'média', 'levier', 'channel']) || 'OTHER').toUpperCase();
      const campaignName = getValueByPossibleNames(['nom campagne', 'campaign', 'nom de campagne', 'campagne']) || `Campagne ${index + 1}`;
      const objective = (getValueByPossibleNames(['objectif marketing', 'marketing objective', 'objectif']) || 'OTHER').toUpperCase();
      const audience = getValueByPossibleNames(['audience cible', 'target audience', 'cible', 'audience']) || 'Audience générale';
      const startDate = getValueByPossibleNames(['date début', 'start date', 'date de début', 'début']) || new Date().toISOString().split('T')[0];
      
      // Parse budget ensuring it's a number
      let budgetStr = getValueByPossibleNames(['budget total', 'total budget', 'budget']) || '0';
      budgetStr = budgetStr.replace(/[^\d.,]/g, '').replace(',', '.');
      const totalBudget = parseFloat(budgetStr) || 0;
      
      // Parse duration
      let durationStr = getValueByPossibleNames(['durée', 'duration', 'jours', 'days']) || '30';
      durationStr = durationStr.replace(/[^\d]/g, '');
      const durationDays = parseInt(durationStr) || 30;
      
      // Extraire les données de semaines (S1, S2, etc.)
      const weeklyBudgetPercentages: Record<string, number> = {};
      const weeklyBudgets: Record<string, number> = {};
      
      // Chercher les colonnes de semaines (S1, S2, S3, etc.)
      Object.keys(row).forEach(key => {
        const weekMatch = key.match(/^S(\d+)/i) || key.match(/^Semaine (\d+)/i) || key.match(/^Week (\d+)/i);
        if (weekMatch) {
          const weekNum = parseInt(weekMatch[1]);
          if (weekNum >= 1 && weekNum <= 52) {
            const weekKey = `S${weekNum}`;
            let value = row[key] || '0';
            // Nettoyer la valeur (enlever % et autres caractères non-numériques)
            value = value.replace(/[^\d.,]/g, '').replace(',', '.');
            const percentage = parseFloat(value) || 0;
            weeklyBudgetPercentages[weekKey] = percentage;
            weeklyBudgets[weekKey] = (percentage / 100) * totalBudget;
          }
        }
      });

      // Create campaign object
      return {
        id: `manual-${Date.now()}-${index}`,
        mediaChannel: mediaChannels.includes(mediaChannel as any) ? mediaChannel : 'OTHER',
        campaignName,
        marketingObjective: marketingObjectives.includes(objective as any) ? objective : 'OTHER',
        targetAudience: audience,
        startDate,
        totalBudget,
        durationDays,
        status: 'ACTIVE' as const,
        weeklyBudgetPercentages,
        weeklyBudgets,
        weeklyActuals: {}
      };
    });
  };

  // Handle Import button click
  const handleImport = () => {
    const campaigns = convertToCampaigns();
    
    if (campaigns.length === 0) {
      toast.error("Aucune donnée valide à importer");
      return;
    }
    
    onImport(campaigns);
  };

  // Focus textarea when modal is shown
  useEffect(() => {
    if (showPasteModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showPasteModal]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Édition de données</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1"
          >
            <FileUp className="w-4 h-4" />
            Copier-coller des données
          </Button>
          <Button 
            onClick={addRow}
            className="flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" />
            Ajouter une ligne
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="border">
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="font-semibold">
                  {header}
                </TableHead>
              ))}
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <TableCell key={cellIndex} className="p-1">
                    {header.toLowerCase().includes('levier média') || 
                     header.toLowerCase().includes('media channel') || 
                     header.toLowerCase().includes('média') ? (
                      <Select
                        value={row[header] || ''}
                        onValueChange={(value) => handleCellChange(rowIndex, header, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mediaChannels.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {channel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : header.toLowerCase().includes('objectif marketing') || 
                       header.toLowerCase().includes('marketing objective') || 
                       header.toLowerCase().includes('objectif') ? (
                      <Select
                        value={row[header] || ''}
                        onValueChange={(value) => handleCellChange(rowIndex, header, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {marketingObjectives.map((objective) => (
                            <SelectItem key={objective} value={objective}>
                              {objective}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : header.toLowerCase().includes('date début') || 
                       header.toLowerCase().includes('start date') || 
                       header.toLowerCase().includes('date de début') ? (
                      <Input
                        type="date"
                        value={row[header] || ''}
                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                      />
                    ) : header.toLowerCase().includes('budget total') || 
                       header.toLowerCase().includes('total budget') || 
                       header.toLowerCase().includes('budget') ? (
                      <Input
                        type="number"
                        value={row[header] || ''}
                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                        min="0"
                        step="100"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                        placeholder={`Entrez ${header}`}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className="p-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRow(rowIndex)}
                    title="Supprimer cette ligne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between mt-4">
        <div className="text-sm text-gray-500">
          {rows.length} lignes, {headers.length} colonnes
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport}
            disabled={rows.length === 0}
            className="bg-belambra-blue hover:bg-belambra-darkBlue"
          >
            <Save className="w-4 h-4 mr-2" />
            Importer les données
          </Button>
        </div>
      </div>

      {showPasteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-2">Copier-coller des données</h3>
            <p className="text-sm text-gray-600 mb-2">
              Collez ici vos données provenant d'Excel, Google Sheets ou tout autre tableau. 
              Les colonnes peuvent être séparées par des tabulations, des virgules ou des points-virgules.
            </p>
            <p className="text-xs text-amber-600 mb-4">
              Note: Si vous avez des cellules contenant des sauts de ligne ou des guillemets, 
              assurez-vous qu'elles sont correctement entourées de guillemets comme dans Excel ou Google Sheets.
            </p>
            
            <div className="mb-4">
              <Label htmlFor="paste-area" className="text-sm font-medium mb-1 block">
                Collez vos données ci-dessous:
              </Label>
              <Textarea
                ref={textareaRef}
                id="paste-area"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder="Exemple:&#10;Levier Média	Nom Campagne	Objectif Marketing	Audience Cible	Date Début	Budget Total&#10;META	Campagne 1	AWARENESS	Familles 25-34	2023-01-01	10000&#10;GOOGLE	Campagne 2	CONVERSION	Hommes 35-44	2023-02-01	15000"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasteModal(false)}>
                Annuler
              </Button>
              <Button onClick={processPasteContent}>
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
