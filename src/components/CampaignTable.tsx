import React, { useState, useRef } from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { Campaign, mediaChannels } from "@/types";
import { weeks } from "@/services/mockData";
import CampaignForm from "./CampaignForm";
import ImportData from "./ImportData";
import CampaignVersions from "./CampaignVersions";
import { toast } from "sonner";
import CampaignTableHeader from "./CampaignTable/CampaignTableHeader";
import CampaignTableToolbar from "./CampaignTable/CampaignTableToolbar";
import CampaignTableRow from "./CampaignTable/CampaignTableRow";
import CampaignTableFooter from "./CampaignTable/CampaignTableFooter";
import { Clock, History, Check, Pause, X } from "lucide-react";

const CampaignTable = () => {
  const {
    campaigns, updateWeeklyBudget, updateWeeklyActual, updateWeeklyPercentage, updateCampaign,
    deleteCampaign, currentWeek
  } = useCampaigns();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingCell, setEditingCell] = useState<{ campaignId: string; week: string; type: 'planned' | 'actual' | 'percentage' } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<'amount' | 'percentage'>('amount');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState("");
  const [selectedVersionCampaignId, setSelectedVersionCampaignId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allFilteredChecked = campaigns.length > 0 && campaigns
    .filter(c => selectedChannel === "all" || c.mediaChannel === selectedChannel)
    .every(c => selectedIds.includes(c.id));
  const someSelected = selectedIds.length > 0;

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

  const filteredCampaigns = campaigns.filter(campaign => 
    selectedChannel === "all" || campaign.mediaChannel === selectedChannel
  );

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'amount' ? 'percentage' : 'amount');
  };

  const handleOpenVersions = (campaignId: string) => {
    setSelectedVersionCampaignId(campaignId);
  };

  React.useEffect(() => {
    if (checkboxRef.current) {
      const isIndeterminate = someSelected && !allFilteredChecked;
      const inputElement = checkboxRef.current.querySelector('input');
      if (inputElement) {
        inputElement.indeterminate = isIndeterminate;
      }
    }
  }, [someSelected, allFilteredChecked]);

  return (
    <div className="mb-6">
      <CampaignTableToolbar
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        displayMode={displayMode}
        toggleDisplayMode={toggleDisplayMode}
        handleDeleteSelected={handleDeleteSelected}
        someSelected={someSelected}
        selectedIds={selectedIds}
        setShowImportForm={setShowImportForm}
        setShowAddForm={setShowAddForm}
      />
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
          <CampaignTableHeader
            allFilteredChecked={allFilteredChecked}
            someSelected={someSelected}
            handleSelectAll={handleSelectAll}
            checkboxRef={checkboxRef}
            selectedChannel={selectedChannel}
            campaigns={campaigns}
            mediaChannels={mediaChannels}
            currentWeek={currentWeek}
          />
          <tbody>
            {filteredCampaigns.map(campaign => (
              <CampaignTableRow
                key={campaign.id}
                campaign={campaign}
                currentWeek={currentWeek}
                handleSelectOne={handleSelectOne}
                selected={selectedIds.includes(campaign.id)}
                editingCell={editingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                handleCellClick={handleCellClick}
                handleCellBlur={handleCellBlur}
                handleCellKeyDown={handleCellKeyDown}
                displayMode={displayMode}
                getStatusIcon={getStatusIcon}
                handleStatusChange={handleStatusChange}
                handleOpenVersions={handleOpenVersions}
                handleDelete={handleDelete}
                editingCampaignField={editingCampaignField}
                editingFieldValue={editingFieldValue}
                setEditingCampaignField={setEditingCampaignField}
                setEditingFieldValue={setEditingFieldValue}
                startEditCampaignField={startEditCampaignField}
                saveEditCampaignField={saveEditCampaignField}
                handleEditCampaignFieldKeyDown={handleEditCampaignFieldKeyDown}
                editingBudget={editingBudget}
                setEditingBudget={setEditingBudget}
                editingBudgetValue={editingBudgetValue}
                setEditingBudgetValue={setEditingBudgetValue}
                handleBudgetEdit={handleBudgetEdit}
                handleBudgetSave={handleBudgetSave}
                getCellClassName={getCellClassName}
                getTotalBudget={getTotalBudget}
                getTotalActual={getTotalActual}
                getVarianceClass={(v: number) => v > 0 ? "text-red-600" : v < 0 ? "text-green-600" : ""}
              />
            ))}
          </tbody>
        </table>
      </div>
      <CampaignTableFooter displayMode={displayMode} />
    </div>
  );
};

export default CampaignTable;
