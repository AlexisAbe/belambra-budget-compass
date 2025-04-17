
import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Campaign } from "@/types";
import { weeks } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import CampaignForm from "./CampaignForm";

const CampaignTable = () => {
  const { campaigns, updateWeeklyBudget, updateWeeklyActual, currentWeek } = useCampaigns();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ campaignId: string; week: string; type: 'planned' | 'actual' } | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCellClick = (campaignId: string, week: string, type: 'planned' | 'actual', currentValue: number) => {
    setEditingCell({ campaignId, week, type });
    setEditValue(currentValue.toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const value = Number(editValue);
      if (!isNaN(value)) {
        if (editingCell.type === 'planned') {
          updateWeeklyBudget(editingCell.campaignId, editingCell.week, value);
        } else {
          updateWeeklyActual(editingCell.campaignId, editingCell.week, value);
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
        <Button 
          onClick={() => setShowAddForm(true)} 
          className="bg-belambra-blue hover:bg-belambra-darkBlue"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter une campagne
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <CampaignForm onCancel={() => setShowAddForm(false)} />
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

              return (
                <tr key={campaign.id}>
                  <td className="fixed-cell border-r left-0">{campaign.mediaChannel}</td>
                  <td className="fixed-cell border-r left-[160px]">{campaign.campaignName}</td>
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
                    
                    // Only show actual value for weeks where we have data
                    const showActual = actualValue > 0;
                    
                    return (
                      <td key={week} className={getCellClassName(week)}>
                        {/* Planned value */}
                        {isEditingPlanned ? (
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
                            onClick={() => handleCellClick(campaign.id, week, 'planned', plannedValue)}
                            className="cursor-pointer"
                          >
                            {plannedValue > 0 ? formatCurrency(plannedValue) : "-"}
                          </div>
                        )}
                        
                        {/* Actual value (only shown if we have data) */}
                        {showActual && (
                          <div className="mt-1 text-xs">
                            {isEditingActual ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={handleCellKeyDown}
                                className="cell-input text-xs"
                                autoFocus
                              />
                            ) : (
                              <div 
                                onClick={() => handleCellClick(campaign.id, week, 'actual', actualValue)}
                                className={`cursor-pointer ${actualValue > plannedValue ? 'text-red-500' : actualValue < plannedValue ? 'text-green-500' : ''}`}
                              >
                                {formatCurrency(actualValue)}
                              </div>
                            )}
                          </div>
                        )}
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
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <span className="inline-block mr-4">* Cliquez sur une cellule pour modifier le montant</span>
        <span className="inline-block mr-4">* Valeurs en <span className="text-red-500">rouge</span>: dépassement</span>
        <span className="inline-block">* Valeurs en <span className="text-green-500">vert</span>: sous-utilisation</span>
      </div>
    </div>
  );
};

export default CampaignTable;
