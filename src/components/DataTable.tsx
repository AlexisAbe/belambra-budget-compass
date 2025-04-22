
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
      // Split by lines
      const lines = pasteContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        toast.error("Aucune donnée valide trouvée dans le contenu collé");
        return;
      }

      // Try to detect delimiter
      const firstLine = lines[0];
      let delimiter = '\t'; // Default to tab
      
      if (firstLine.includes(',')) {
        delimiter = ',';
      } else if (firstLine.includes(';')) {
        delimiter = ';';
      }

      // Determine if first line contains headers or data
      const useFirstLineAsHeaders = confirm("La première ligne contient-elle des en-têtes de colonnes?");
      
      let newHeaders: string[];
      let dataLines: string[];
      
      if (useFirstLineAsHeaders) {
        newHeaders = lines[0].split(delimiter).map(h => h.trim());
        dataLines = lines.slice(1);
      } else {
        newHeaders = headers;
        dataLines = lines;
      }

      // Process data rows
      const newRows = dataLines.map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const row: Record<string, string> = {};
        
        newHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
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

  // Convert table data to campaigns
  const convertToCampaigns = (): Partial<Campaign>[] => {
    return rows.filter(row => {
      // Skip empty rows
      const hasValues = Object.values(row).some(value => value && value.trim() !== '');
      return hasValues;
    }).map((row, index) => {
      // Map headers to campaign fields
      const mediaChannel = (row['Levier Média'] || row['Media Channel'] || row['Levier Media'] || '').toUpperCase();
      const campaignName = row['Nom Campagne'] || row['Campaign Name'] || row['Nom de Campagne'] || `Campagne ${index + 1}`;
      const objective = (row['Objectif Marketing'] || row['Marketing Objective'] || row['Objectif'] || '').toUpperCase();
      const audience = row['Audience Cible'] || row['Target Audience'] || row['Cible'] || 'Audience générale';
      const startDate = row['Date Début'] || row['Start Date'] || row['Date de Début'] || new Date().toISOString().split('T')[0];
      
      // Parse budget ensuring it's a number
      let budgetStr = row['Budget Total'] || row['Total Budget'] || row['Budget'] || '0';
      budgetStr = budgetStr.replace(/[^\d.,]/g, '').replace(',', '.');
      const totalBudget = parseFloat(budgetStr) || 0;

      // Create campaign object
      return {
        id: `manual-${Date.now()}-${index}`,
        mediaChannel: mediaChannels.includes(mediaChannel as any) ? mediaChannel : 'OTHER',
        campaignName,
        marketingObjective: marketingObjectives.includes(objective as any) ? objective : 'OTHER',
        targetAudience: audience,
        startDate,
        totalBudget,
        durationDays: 30,
        status: 'ACTIVE' as const,
        weeklyBudgets: {},
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
                    {header === 'Levier Média' || header === 'Media Channel' || header === 'Levier Media' ? (
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
                    ) : header === 'Objectif Marketing' || header === 'Marketing Objective' || header === 'Objectif' ? (
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
                    ) : header === 'Date Début' || header === 'Start Date' || header === 'Date de Début' ? (
                      <Input
                        type="date"
                        value={row[header] || ''}
                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                      />
                    ) : header === 'Budget Total' || header === 'Total Budget' || header === 'Budget' ? (
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
            <p className="text-sm text-gray-600 mb-4">
              Collez ici vos données provenant d'Excel, Google Sheets ou tout autre tableau. 
              Les colonnes peuvent être séparées par des tabulations, des virgules ou des points-virgules.
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
                placeholder="Exemple:&#10;Levier Média,Nom Campagne,Objectif Marketing,Audience Cible,Date Début,Budget Total&#10;META,Campagne 1,AWARENESS,Femmes 25-34,2023-01-01,10000&#10;GOOGLE,Campagne 2,CONVERSION,Hommes 35-44,2023-02-01,15000"
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
