import React, { useState, useRef } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Campaign, mediaChannels } from "@/types";
import { weeks } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Pencil, FileUp, PlusCircle, Trash2, Check, Pause, X, Filter, Percent, History, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import CampaignForm from "./CampaignForm";
import ImportData from "./ImportData";
import CampaignVersions from "./CampaignVersions";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CampaignTable = () => {
  const { campaigns, updateWeeklyBudget, updateWeeklyActual, updateWeeklyPercentage, updateCampaign, deleteCampaign, currentWeek } = useCampaigns();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ campaignId: string; week: string; type: 'planned' | 'actual' | 'percentage' } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<'amount' | 'percentage'>('amount');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState("");
  const [selectedVersionCampaignId, setSelectedVersionCampaignId] = useState<string | null>(null);

  // NEW: checkbox selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allFilteredChecked = campaigns.length > 0 && campaigns
    .filter(c => selectedChannel === "all" || c.mediaChannel === selectedChannel)
    .every(c => selectedIds.includes(c.id));
  const someSelected = selectedIds.length > 0;
  
  // Create a reference for the checkbox
  const checkboxRef = useRef<HTMLButtonElement>(null);

  const handleSelectOne = (campaignId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, campaignId] : prev.filter((id) => id !== campaignId)
    );
  };
  const handleSelectAll = (checked: boolean) => {
    const filtered = campaigns.filter(c => selectedChannel === "all" || c.mediaChannel === selectedChannel);
    setSelectedIds(checked ? filtered.map(c => c.id) : []);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} campagne(s) ?`)) {
      selectedIds.forEach(deleteCampaign);
      setSelectedIds([]);
    }
  };

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
      setSelectedIds(ids => ids.filter(id => id !== campaignId));
    }
  };

  const handleBudgetEdit = (campaignId: string, currentBudget: number) => {
    setEditingBudget(campaignId);
    setEditingBudgetValue(currentBudget.toString());
  };

  const handleBudgetSave = (campaign: Campaign) => {
    const newBudget = parseFloat(editingBudgetValue);
    if (!isNaN(newBudget) && newBudget >= 0) {
      const newWeeklyBudgets = { ...campaign.weeklyBudgets };
      Object.entries(campaign.weeklyBudgetPercentages || {}).forEach(([week, percentage]) => {
        newWeeklyBudgets[week] = (percentage / 100) * newBudget;
      });

      const updatedCampaign = {
        ...campaign,
        totalBudget: newBudget,
        weeklyBudgets: newWeeklyBudgets
      };
      
      updateCampaign(updatedCampaign);
      toast.success("Budget total mis à jour");
    }
    setEditingBudget(null);
  };

  // ---- NEW: Edit campaign info (inline editable cells) ----

  const [editingCampaignField, setEditingCampaignField] = useState<{ campaignId: string; field: string } | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState("");

  const startEditCampaignField = (campaignId: string, field: keyof Campaign, currentValue: string) => {
    setEditingCampaignField({ campaignId, field });
    setEditingFieldValue(currentValue);
  };
  const saveEditCampaignField = (campaign: Campaign, field: keyof Campaign) => {
    if (editingFieldValue.trim() && editingFieldValue !== (campaign as any)[field]) {
      updateCampaign({ ...campaign, [field]: editingFieldValue });
      toast.success(`Champ "${field}" modifié`);
    }
    setEditingCampaignField(null);
    setEditingFieldValue("");
  };
  const handleEditCampaignFieldKeyDown = (e: React.KeyboardEvent, campaign: Campaign, field: keyof Campaign) => {
    if (e.key === "Enter") saveEditCampaignField(campaign, field);
    if (e.key === "Escape") setEditingCampaignField(null);
  };

  // ------

  const filteredCampaigns = campaigns.filter(campaign => 
    selectedChannel === "all" || campaign.mediaChannel === selectedChannel
  );

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'amount' ? 'percentage' : 'amount');
  };

  const handleOpenVersions = (campaignId: string) => {
    setSelectedVersionCampaignId(campaignId);
  };

  // Effect to manually set the visual indeterminate state of the checkbox
  React.useEffect(() => {
    if (checkboxRef.current) {
      // We need to use DOM API to set indeterminate state as it's not a React prop
      const isIndeterminate = someSelected && !allFilteredChecked;
      
      // Access the actual checkbox input inside the Checkbox component
      const inputElement = checkboxRef.current.querySelector('input');
      if (inputElement) {
        inputElement.indeterminate = isIndeterminate;
      }
    }
  }, [someSelected, allFilteredChecked]);

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
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleDeleteSelected}
            disabled={!someSelected}
          >
            <Trash2 className="w-4 h-4" />
            {someSelected ? `Supprimer (${selectedIds.length})` : "Supprimer"}
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

      {selectedVersionCampaignId && (
        <CampaignVersions 
          campaignId={selectedVersionCampaignId}
          open={!!selectedVersionCampaignId}
          onOpenChange={(open) => {
            if (!open) setSelectedVersionCampaignId(null);
          }}
        />
      )}
      
      <div className="bg-sky-50 border border-sky-200 rounded-md p-3 mb-4 flex items-center">
        <Clock className="w-5 h-5 text-sky-500 mr-2 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-medium text-sky-700">Historique et versions des campagnes</h3>
          <p className="text-sm text-sky-600">
            Chaque campagne dispose d'un historique de versions. Cliquez sur l'icône <History className="w-4 h-4 inline mx-1" /> 
            dans la colonne "Actions" pour consulter ou restaurer une version précédente.
          </p>
        </div>
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="header-cell w-8 sticky left-0 bg-white z-30">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={allFilteredChecked}
                    onCheckedChange={(value: any) => handleSelectAll(!!value)}
                    ref={checkboxRef}
                  />
                </div>
              </th>
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
                    <td className="sticky left-0 z-20 bg-white border-r">
                      <Checkbox
                        checked={selectedIds.includes(campaign.id)}
                        onCheckedChange={(value: any) =>
                          handleSelectOne(campaign.id, !!value)
                        }
                        aria-label="Sélectionner cette campagne"
                      />
                    </td>
                    <td className="fixed-cell border-r left-0 bg-gray-100">
                      {campaign.mediaChannel}
                    </td>
                    <td className="fixed-cell border-r left-[160px] bg-gray-100">
                      {editingCampaignField && editingCampaignField.campaignId === campaign.id && editingCampaignField.field === "campaignName" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingFieldValue}
                            onChange={(e) => setEditingFieldValue(e.target.value)}
                            onBlur={() => saveEditCampaignField(campaign, "campaignName")}
                            onKeyDown={(e) => handleEditCampaignFieldKeyDown(e, campaign, "campaignName")}
                            className="border rounded px-2 py-1 w-full"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center group">
                          <span
                            className="truncate cursor-pointer w-full"
                            onDoubleClick={() => startEditCampaignField(campaign.id, "campaignName", campaign.campaignName)}
                          >
                            {campaign.campaignName}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Pencil
                                  className="ml-1 w-4 h-4 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 cursor-pointer"
                                  onClick={() => startEditCampaignField(campaign.id, "campaignName", campaign.campaignName)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modifier le nom</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </td>
                    <td className="fixed-cell border-r left-[340px] bg-gray-100">
                      {editingCampaignField && editingCampaignField.campaignId === campaign.id && editingCampaignField.field === "marketingObjective" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingFieldValue}
                            onChange={(e) => setEditingFieldValue(e.target.value)}
                            onBlur={() => saveEditCampaignField(campaign, "marketingObjective")}
                            onKeyDown={(e) => handleEditCampaignFieldKeyDown(e, campaign, "marketingObjective")}
                            className="border rounded px-2 py-1 w-full"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center group">
                          <span
                            className="truncate cursor-pointer w-full"
                            onDoubleClick={() => startEditCampaignField(campaign.id, "marketingObjective", campaign.marketingObjective)}
                          >
                            {campaign.marketingObjective}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Pencil
                                  className="ml-1 w-4 h-4 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 cursor-pointer"
                                  onClick={() => startEditCampaignField(campaign.id, "marketingObjective", campaign.marketingObjective)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modifier l'objectif</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </td>
                    <td className="fixed-cell border-r left-[480px] bg-gray-100 text-xs">
                      {editingCampaignField && editingCampaignField.campaignId === campaign.id && editingCampaignField.field === "targetAudience" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingFieldValue}
                            onChange={(e) => setEditingFieldValue(e.target.value)}
                            onBlur={() => saveEditCampaignField(campaign, "targetAudience")}
                            onKeyDown={(e) => handleEditCampaignFieldKeyDown(e, campaign, "targetAudience")}
                            className="border rounded px-2 py-1 w-full"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center group">
                          <span
                            className="truncate cursor-pointer w-full"
                            onDoubleClick={() => startEditCampaignField(campaign.id, "targetAudience", campaign.targetAudience)}
                          >
                            {campaign.targetAudience}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Pencil
                                  className="ml-1 w-4 h-4 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 cursor-pointer"
                                  onClick={() => startEditCampaignField(campaign.id, "targetAudience", campaign.targetAudience)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modifier la cible</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </td>
                    <td className="fixed-cell border-r left-[610px] bg-gray-100">
                      {editingCampaignField && editingCampaignField.campaignId === campaign.id && editingCampaignField.field === "startDate" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editingFieldValue}
                            onChange={(e) => setEditingFieldValue(e.target.value)}
                            onBlur={() => saveEditCampaignField(campaign, "startDate")}
                            onKeyDown={(e) => handleEditCampaignFieldKeyDown(e, campaign, "startDate")}
                            className="border rounded px-2 py-1 w-full"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center group">
                          <span
                            className="truncate cursor-pointer w-full"
                            onDoubleClick={() => startEditCampaignField(campaign.id, "startDate", campaign.startDate)}
                          >
                            {campaign.startDate}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Pencil
                                  className="ml-1 w-4 h-4 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 cursor-pointer"
                                  onClick={() => startEditCampaignField(campaign.id, "startDate", campaign.startDate)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modifier la date</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </td>
                    <td className="fixed-cell border-r left-[720px] bg-gray-100 text-right">
                      {editingBudget === campaign.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editingBudgetValue}
                            onChange={(e) => setEditingBudgetValue(e.target.value)}
                            onBlur={() => handleBudgetSave(campaign)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleBudgetSave(campaign);
                              if (e.key === 'Escape') setEditingBudget(null);
                            }}
                            className="w-24 px-2 py-1 text-right border rounded"
                            autoFocus
                          />
                          €
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded group flex items-center"
                          onClick={() => handleBudgetEdit(campaign.id, campaign.totalBudget)}
                        >
                          {formatCurrency(campaign.totalBudget)}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Pencil
                                  className="ml-1 w-4 h-4 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBudgetEdit(campaign.id, campaign.totalBudget);
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modifier le budget</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </td>
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
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenVersions(campaign.id)}
                                className="text-sky-600 hover:text-sky-900 hover:bg-sky-50 border-sky-200"
                              >
                                <History className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Historique des versions</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(campaign.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer la campagne</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
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
          <span>* Cliquez sur une cellule ou l'icône <Pencil className="inline align-text-bottom w-3 h-3" /> pour modifier les éléments de campagne.</span>
          <span>* Cochez pour sélectionner une ou plusieurs campagnes puis cliquez sur "Supprimer".</span>
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
