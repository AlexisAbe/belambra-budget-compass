
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, History, Trash2, Check, Pause, X } from "lucide-react";
import { weeks } from "@/services/mockData";
import { formatCurrency } from "@/lib/utils";
import CampaignTableCell from "./CampaignTableCell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Campaign } from "@/types";

interface Props {
  campaign: Campaign;
  currentWeek: string;
  handleSelectOne: (id: string, checked: boolean) => void;
  selected: boolean;
  editingCell: {
    campaignId: string;
    week: string;
    type: 'planned' | 'actual' | 'percentage';
  } | null;
  editValue: string;
  setEditValue: (v: string) => void;
  handleCellClick: (campaignId: string, week: string, type: 'planned' | 'actual' | 'percentage', value: number) => void;
  handleCellBlur: () => void;
  handleCellKeyDown: (e: React.KeyboardEvent) => void;
  displayMode: 'amount' | 'percentage';
  getStatusIcon: (status: Campaign["status"]) => React.ReactNode;
  handleStatusChange: (id: string, status: Campaign["status"]) => void;
  handleOpenVersions: (id: string) => void;
  handleDelete: (id: string) => void;
  editingCampaignField: { campaignId: string; field: string } | null;
  editingFieldValue: string;
  setEditingCampaignField: (v: { campaignId: string; field: string } | null) => void;
  setEditingFieldValue: (v: string) => void;
  startEditCampaignField: (id: string, field: keyof Campaign, val: string) => void;
  saveEditCampaignField: (c: Campaign, field: keyof Campaign) => void;
  handleEditCampaignFieldKeyDown: (e: React.KeyboardEvent, c: Campaign, field: keyof Campaign) => void;
  editingBudget: string | null;
  setEditingBudget: (v: string | null) => void;
  editingBudgetValue: string;
  setEditingBudgetValue: (v: string) => void;
  handleBudgetEdit: (id: string, budget: number) => void;
  handleBudgetSave: (c: Campaign) => void;
  getCellClassName: (week: string) => string;
  getTotalBudget: (c: Campaign) => number;
  getTotalActual: (c: Campaign) => number;
  getVarianceClass: (v: number) => string;
}

const CampaignTableRow: React.FC<Props> = (props) => {
  const {
    campaign,
    currentWeek,
    handleSelectOne,
    selected,
    editingCell,
    editValue,
    setEditValue,
    handleCellClick,
    handleCellBlur,
    handleCellKeyDown,
    displayMode,
    getStatusIcon,
    handleStatusChange,
    handleOpenVersions,
    handleDelete,
    editingCampaignField,
    editingFieldValue,
    setEditingCampaignField,
    setEditingFieldValue,
    startEditCampaignField,
    saveEditCampaignField,
    handleEditCampaignFieldKeyDown,
    editingBudget,
    setEditingBudget,
    editingBudgetValue,
    setEditingBudgetValue,
    handleBudgetEdit,
    handleBudgetSave,
    getCellClassName,
    getTotalBudget,
    getTotalActual,
    getVarianceClass
  } = props;

  const totalPlanned = getTotalBudget(campaign);
  const totalActual = getTotalActual(campaign);
  const variance = totalActual - totalPlanned;
  const varianceClass = getVarianceClass(variance);

  return (
    <tr>
      <td className="sticky left-0 z-20 bg-white border-r">
        <Checkbox
          checked={selected}
          onCheckedChange={(value: any) =>
            handleSelectOne(campaign.id, !!value)
          }
          aria-label="Sélectionner cette campagne"
        />
      </td>
      <td className="fixed-cell border-r left-0 bg-gray-100">
        {campaign.mediaChannel}
      </td>
      {/* Nom Campagne, Marketing, Cible, Début, Budget Total, Statut, Actions */}
      {["campaignName", "marketingObjective", "targetAudience", "startDate"].map((key, idx) => {
        const field = key as keyof Campaign;
        const isEditing = editingCampaignField?.campaignId === campaign.id && editingCampaignField.field === field;
        return (
          <td
            key={key}
            className={`fixed-cell border-r left-[${160 + idx * 180}px] bg-gray-100`}
          >
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type={field === "startDate" ? "date" : "text"}
                  value={editingFieldValue}
                  onChange={(e) => setEditingFieldValue(e.target.value)}
                  onBlur={() => saveEditCampaignField(campaign, field)}
                  onKeyDown={(e) => handleEditCampaignFieldKeyDown(e, campaign, field)}
                  className="border rounded px-2 py-1 w-full"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center group">
                <span
                  className="truncate cursor-pointer w-full"
                  onDoubleClick={() => startEditCampaignField(campaign.id, field, (campaign as any)[field])}
                >
                  {(campaign as any)[field]}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Pencil
                        className="ml-1 w-4 h-4 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={() => startEditCampaignField(campaign.id, field, (campaign as any)[field])}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Modifier {field}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </td>
        );
      })}
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
          onValueChange={(value) => handleStatusChange(campaign.id, value as Campaign["status"])}
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
              {displayMode === "percentage" && (
                <CampaignTableCell
                  value={percentageValue}
                  editingCell={editingCell}
                  campaignId={campaign.id}
                  week={week}
                  type="percentage"
                  editValue={editValue}
                  setEditValue={setEditValue}
                  handleCellClick={handleCellClick}
                  handleCellBlur={handleCellBlur}
                  handleCellKeyDown={handleCellKeyDown}
                  cellClassName="text-xs text-gray-500 p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  displayMode={displayMode}
                />
              )}
              <CampaignTableCell
                value={plannedValue}
                editingCell={editingCell}
                campaignId={campaign.id}
                week={week}
                type="planned"
                editValue={editValue}
                setEditValue={setEditValue}
                handleCellClick={handleCellClick}
                handleCellBlur={handleCellBlur}
                handleCellKeyDown={handleCellKeyDown}
                cellClassName="p-1 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                displayMode={displayMode}
                formatCurrency={formatCurrency}
              />
              <CampaignTableCell
                value={actualValue}
                editingCell={editingCell}
                campaignId={campaign.id}
                week={week}
                type="actual"
                editValue={editValue}
                setEditValue={setEditValue}
                handleCellClick={handleCellClick}
                handleCellBlur={handleCellBlur}
                handleCellKeyDown={handleCellKeyDown}
                cellClassName="p-1 bg-green-50 rounded cursor-pointer hover:bg-green-100"
                displayMode={displayMode}
                variance={variance}
                formatCurrency={formatCurrency}
              />
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
  );
};

export default CampaignTableRow;
