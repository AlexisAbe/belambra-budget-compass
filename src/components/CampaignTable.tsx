
import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Campaign } from "@/types";
import { weeks } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { FileUp, PlusCircle } from "lucide-react";
import CampaignForm from "./CampaignForm";
import ImportData from "./ImportData";

const CampaignTable = () => {
  const { campaigns, updateWeeklyBudget, updateWeeklyActual, updateWeeklyPercentage, currentWeek } = useCampaigns();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ campaignId: string; week: string; type: 'planned' | 'actual' | 'percentage' } | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCellClick = (campaignId: string, week: string, type: 'planned' | 'actual' | 'percentage', currentValue: number) => {
    setEditingCell({ campaignId, week, type });
    setEditValue(currentValue.toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const value = Number(editValue);
      if (!isNaN(value)) {
        if (editingCell.type === 'planned') {
          updateWeeklyBudget(editingCell.campaignId, editingCell.week, value);
        } else if (editingCell.type === 'actual') {
          updateWeeklyActual(editingCell.campaignId, editingCell.week, value);
        } else if (editingCell.type === 'percentage') {
          updateWeeklyPercentage(editingCell.campaignId, editingCell.week, value);
        }
      }
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Helper to get total budget for a campaign
  const getTotalBudget = (campaign: Campaign) => {
    return Object.values(campaign.weeklyBudgets).reduce((sum, value) => sum + value, 0);
  };

  // Helper to get total actual spend for a campaign
  const getTotalActual = (campaign: Campaign) => {
    return Object.values(campaign.weeklyActuals).reduce((sum, value) => sum + value, 0);
  };

  const getCellClassName = (week: string) => {
    return week === currentWeek ? "data-cell cell-highlight" : "data-cell";
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Campagnes</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowImportForm(true)}
            variant="outline"
            className="border-belambra-blue text-belambra-blue hover:bg-belambra-blue/10"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Importer des données
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="bg-belambra-blue hover:bg-belambra-darkBlue"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter une campagne
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <CampaignForm onCancel={() => setShowAddForm(false)} />
        </div>
      )}
      
      {showImportForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <ImportData onClose={() => setShowImportForm(false)} />
        </div>
      )}

      <div className="table-container">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="header-cell fixed-cell z-20 min-w-[160px]">Levier Média</th>
              <th className="header-cell fixed-cell z-20 left-[160px] min-w-[180px]">Nom Campagne</th>
              <th className="header-cell fixed-cell z-20 left-[340px] min-w-[140px]">Objectif</th>
              <th className="header-cell fixed-cell z-20 left-[480px] min-w-[130px]">Cible</th>
              <th className="header-cell fixed-cell z-20 left-[610px] min-w-[110px]">Début</th>
              <th className="header-cell fixed-cell z-20 left-[720px] min-w-[130px]">Budget Total</th>
              <th className="header-cell fixed-cell z-20 left-[850px] min-w-[80px]">Jours</th>
              {weeks.map(week => (
                <th key={week} className={`header-cell min-w-[70px] ${week === currentWeek ? 'bg-belambra-teal' : ''}`}>
                  {week}
                </th>
              ))}
              <th className="header-cell min-w-[100px]">Total Prévu</th>
              <th className="header-cell min-w-[100px]">Total Réel</th>
              <th className="header-cell min-w-[100px]">Écart</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => {
              const totalPlanned = getTotalBudget(campaign);
              const totalActual = getTotalActual(campaign);
              const variance = totalActual - totalPlanned;
              const varianceClass = 
                variance > 0 ? "text-red-600" : 
                variance < 0 ? "text-green-600" : "";

              // First row: percentages
              return (
                <React.Fragment key={campaign.id}>
                  <tr>
                    <td className="fixed-cell border-r left-0 bg-gray-100">{campaign.mediaChannel}</td>
                    <td className="fixed-cell border-r left-[160px] bg-gray-100">{campaign.campaignName}</td>
                    <td className="fixed-cell border-r left-[340px] bg-gray-100 text-center font-medium" colSpan={5}>
                      Pourcentage (%)
                    </td>
                    
                    {weeks.map(week => {
                      const percentValue = campaign.weeklyBudgetPercentages?.[week] || 0;
                      
                      // Determine if this cell is currently being edited
                      const isEditingPercent = editingCell?.campaignId === campaign.id && 
                                            editingCell?.week === week && 
                                            editingCell?.type === 'percentage';
                      
                      return (
                        <td key={`${week}-percent`} className={`${getCellClassName(week)} bg-gray-100`}>
                          {isEditingPercent ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              className="cell-input"
                              autoFocus
                            />
                          ) : (
                            <div 
                              onClick={() => handleCellClick(campaign.id, week, 'percentage', percentValue)}
                              className="cursor-pointer text-center"
                            >
                              {percentValue > 0 ? `${percentValue}%` : "-"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="data-cell bg-gray-100 text-center">100%</td>
                    <td className="data-cell bg-gray-100"></td>
                    <td className="data-cell bg-gray-100"></td>
                  </tr>

                  {/* Second row: budget values */}
                  <tr>
                    <td className="fixed-cell border-r left-0"></td>
                    <td className="fixed-cell border-r left-[160px]"></td>
                    <td className="fixed-cell border-r left-[340px]">{campaign.marketingObjective}</td>
                    <td className="fixed-cell border-r left-[480px] text-xs">{campaign.targetAudience}</td>
                    <td className="fixed-cell border-r left-[610px]">{campaign.startDate}</td>
                    <td className="fixed-cell border-r left-[720px] text-right">{formatCurrency(campaign.totalBudget)}</td>
                    <td className="fixed-cell border-r left-[850px] text-center">{campaign.durationDays}</td>
                    
                    {weeks.map(week => {
                      const plannedValue = campaign.weeklyBudgets[week] || 0;
                      const actualValue = campaign.weeklyActuals[week] || 0;
                      
                      // Determine if this cell is currently being edited
                      const isEditingPlanned = editingCell?.campaignId === campaign.id && 
                                              editingCell?.week === week && 
                                              editingCell?.type === 'planned';
                      
                      const isEditingActual = editingCell?.campaignId === campaign.id && 
                                            editingCell?.week === week && 
                                            editingCell?.type === 'actual';
                      
                      return (
                        <td key={week} className={getCellClassName(week)}>
                          <div className="flex flex-col gap-1">
                            {/* Planned value */}
                            <div className="p-1 bg-blue-50 rounded">
                              {isEditingPlanned ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="cell-input w-full"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  onClick={() => handleCellClick(campaign.id, week, 'planned', plannedValue)}
                                  className="cursor-pointer text-xs text-center"
                                >
                                  {plannedValue > 0 ? formatCurrency(plannedValue) : "-"}
                                </div>
                              )}
                            </div>
                            
                            {/* Actual value */}
                            <div className="p-1 bg-green-50 rounded">
                              {isEditingActual ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="cell-input w-full"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  onClick={() => handleCellClick(campaign.id, week, 'actual', actualValue)}
                                  className={`cursor-pointer text-xs text-center ${actualValue > plannedValue ? 'text-red-500' : actualValue < plannedValue ? 'text-green-500' : ''}`}
                                >
                                  {actualValue > 0 ? formatCurrency(actualValue) : "-"}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    
                    {/* Totals and variance */}
                    <td className="data-cell font-semibold">{formatCurrency(totalPlanned)}</td>
                    <td className="data-cell font-semibold">{formatCurrency(totalActual)}</td>
                    <td className={`data-cell font-semibold ${varianceClass}`}>
                      {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>* Cliquez sur une cellule pour modifier le montant</span>
          <span>* <span className="bg-blue-50 px-1 rounded">Bleu</span>: Budget prévu</span>
          <span>* <span className="bg-green-50 px-1 rounded">Vert</span>: Budget réel</span>
          <span>* Valeurs en <span className="text-red-500">rouge</span>: dépassement</span>
          <span>* Valeurs en <span className="text-green-500">vert</span>: sous-utilisation</span>
        </div>
      </div>
    </div>
  );
};

export default CampaignTable;
