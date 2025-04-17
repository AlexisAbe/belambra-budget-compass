import React, { useState } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Campaign, mediaChannels } from "@/types";
import { weeks } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { FileUp, PlusCircle, Trash2, Check, Pause, X, Filter, Percent } from "lucide-react";
import CampaignForm from "./CampaignForm";
import ImportData from "./ImportData";
import { toast } from "sonner";

const CampaignTable = () => {
  const { campaigns, updateWeeklyBudget, updateWeeklyActual, updateWeeklyPercentage, updateCampaign, deleteCampaign, currentWeek } = useCampaigns();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ campaignId: string; week: string; type: 'planned' | 'actual' | 'percentage' } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<'amount' | 'percentage'>('amount');

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

  const getTotalBudget = (campaign: Campaign) => {
    return Object.values(campaign.weeklyBudgets).reduce((sum, value) => sum + value, 0);
  };

  const getTotalActual = (campaign: Campaign) => {
    return Object.values(campaign.weeklyActuals).reduce((sum, value) => sum + value, 0);
  };

  const getCellClassName = (week: string) => {
    return week === currentWeek ? "data-cell cell-highlight" : "data-cell";
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'PAUSED':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'DELETED':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleStatusChange = (campaignId: string, status: Campaign['status']) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      updateCampaign({ ...campaign, status });
      toast.success(`Statut de la campagne mis à jour: ${status}`);
    }
  };

  const handleDelete = (campaignId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      deleteCampaign(campaignId);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => 
    selectedChannel === "all" || campaign.mediaChannel === selectedChannel
  );

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'amount' ? 'percentage' : 'amount');
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Campagnes</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select
              value={selectedChannel}
              onValueChange={setSelectedChannel}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par levier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les leviers</SelectItem>
                {mediaChannels.map(channel => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDisplayMode}
            className="flex items-center gap-1"
          >
            <Percent className="w-4 h-4" />
            {displayMode === 'amount' ? 'Afficher %' : 'Afficher €'}
          </Button>
        </div>
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
              <th className="header-cell fixed-cell z-20 left-[850px] min-w-[80px]">Statut</th>
              <th className="header-cell fixed-cell z-20 left-[930px] min-w-[80px]">Actions</th>
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
            {filteredCampaigns.map(campaign => {
              const totalPlanned = getTotalBudget(campaign);
              const totalActual = getTotalActual(campaign);
              const variance = totalActual - totalPlanned;
              const varianceClass = variance > 0 ? "text-red-600" : variance < 0 ? "text-green-600" : "";

              return (
                <React.Fragment key={campaign.id}>
                  <tr>
                    <td className="fixed-cell border-r left-0 bg-gray-100">{campaign.mediaChannel}</td>
                    <td className="fixed-cell border-r left-[160px] bg-gray-100">{campaign.campaignName}</td>
                    <td className="fixed-cell border-r left-[340px] bg-gray-100">{campaign.marketingObjective}</td>
                    <td className="fixed-cell border-r left-[480px] bg-gray-100 text-xs">{campaign.targetAudience}</td>
                    <td className="fixed-cell border-r left-[610px] bg-gray-100">{campaign.startDate}</td>
                    <td className="fixed-cell border-r left-[720px] bg-gray-100 text-right">{formatCurrency(campaign.totalBudget)}</td>
                    <td className="fixed-cell border-r left-[850px] bg-gray-100">
                      <Select
                        value={campaign.status}
                        onValueChange={(value: Campaign['status']) => handleStatusChange(campaign.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(campaign.status)}
                            <span>{campaign.status}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              ACTIVE
                            </div>
                          </SelectItem>
                          <SelectItem value="PAUSED">
                            <div className="flex items-center gap-2">
                              <Pause className="w-4 h-4 text-yellow-500" />
                              PAUSED
                            </div>
                          </SelectItem>
                          <SelectItem value="DELETED">
                            <div className="flex items-center gap-2">
                              <X className="w-4 h-4 text-red-500" />
                              DELETED
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="fixed-cell border-r left-[930px] bg-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                    
                    {weeks.map(week => {
                      const plannedValue = campaign.weeklyBudgets[week] || 0;
                      const actualValue = campaign.weeklyActuals[week] || 0;
                      const percentageValue = campaign.weeklyBudgetPercentages?.[week] || 0;
                      const variance = actualValue - plannedValue;
                      
                      return (
                        <td key={week} className={getCellClassName(week)}>
                          <div className="flex flex-col gap-1 p-1">
                            {displayMode === 'percentage' && (
                              <div 
                                className="text-xs text-gray-500 p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                                onClick={() => handleCellClick(campaign.id, week, 'percentage', percentageValue)}
                              >
                                {editingCell && 
                                 editingCell.campaignId === campaign.id && 
                                 editingCell.week === week && 
                                 editingCell.type === 'percentage' ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleCellBlur}
                                    onKeyDown={handleCellKeyDown}
                                    autoFocus
                                    className="w-full text-center outline-none"
                                  />
                                ) : (
                                  `${percentageValue > 0 ? percentageValue.toFixed(1) : "0"}%`
                                )}
                              </div>
                            )}
                            
                            <div 
                              className="p-1 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                              onClick={() => handleCellClick(campaign.id, week, 'planned', plannedValue)}
                            >
                              {editingCell && 
                               editingCell.campaignId === campaign.id && 
                               editingCell.week === week && 
                               editingCell.type === 'planned' ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  autoFocus
                                  className="w-full text-center outline-none"
                                />
                              ) : (
                                <div>
                                  <div className="text-xs text-gray-500">Prévu</div>
                                  <div>{plannedValue > 0 ? formatCurrency(plannedValue) : "-"}</div>
                                </div>
                              )}
                            </div>
                            
                            <div 
                              className="p-1 bg-green-50 rounded cursor-pointer hover:bg-green-100"
                              onClick={() => handleCellClick(campaign.id, week, 'actual', actualValue)}
                            >
                              {editingCell && 
                               editingCell.campaignId === campaign.id && 
                               editingCell.week === week && 
                               editingCell.type === 'actual' ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  autoFocus
                                  className="w-full text-center outline-none"
                                />
                              ) : (
                                <div>
                                  <div className="text-xs text-gray-500">Réel</div>
                                  <div className={variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : ''}>
                                    {actualValue > 0 ? formatCurrency(actualValue) : "-"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    
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
          <span>* <span className="bg-blue-50 px-1 rounded">Bleu</span>: Budget prévu {displayMode === 'percentage' && '(%)' || '(€)'}</span>
          <span>* <span className="bg-green-50 px-1 rounded">Vert</span>: Budget réel</span>
          <span>* Valeurs en <span className="text-red-500">rouge</span>: dépassement</span>
          <span>* Valeurs en <span className="text-green-500">vert</span>: sous-utilisation</span>
        </div>
      </div>
    </div>
  );
};

export default CampaignTable;
