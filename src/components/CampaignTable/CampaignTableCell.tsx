
import React from "react";

interface Props {
  value: number;
  editingCell: {
    campaignId: string;
    week: string;
    type: 'planned' | 'actual' | 'percentage';
  } | null;
  campaignId: string;
  week: string;
  type: 'planned' | 'actual' | 'percentage';
  editValue: string;
  setEditValue: (v: string) => void;
  handleCellClick: (campaignId: string, week: string, type: 'planned' | 'actual' | 'percentage', value: number) => void;
  handleCellBlur: () => void;
  handleCellKeyDown: (e: React.KeyboardEvent) => void;
  cellClassName?: string;
  displayMode?: string;
  variance?: number;
  formatCurrency?: (v: number) => string;
}

const CampaignTableCell: React.FC<Props> = ({
  value,
  editingCell,
  campaignId,
  week,
  type,
  editValue,
  setEditValue,
  handleCellClick,
  handleCellBlur,
  handleCellKeyDown,
  cellClassName = "",
  displayMode = "amount",
  variance = 0,
  formatCurrency
}) => {
  if (type === "percentage" && displayMode !== "percentage") return null;
  return (
    <div
      className={cellClassName}
      onClick={() => handleCellClick(campaignId, week, type, value)}
    >
      {editingCell && editingCell.campaignId === campaignId && editingCell.week === week && editingCell.type === type
        ? (
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
          <>
            {type === 'percentage'
              ? `${value > 0 ? value.toFixed(1) : "0"}%`
              : type === 'planned'
                ? (
                    <div>
                      <div className="text-xs text-gray-500">Prévu</div>
                      <div>{formatCurrency ? (value > 0 ? formatCurrency(value) : "-") : value}</div>
                    </div>
                  )
                : type === 'actual'
                  ? (
                    <div>
                      <div className="text-xs text-gray-500">Réel</div>
                      <div className={variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : ''}>
                        {formatCurrency ? (value > 0 ? formatCurrency(value) : "-") : value}
                      </div>
                    </div>
                  )
                  : value
            }
          </>
        )
      }
    </div>
  );
};

export default CampaignTableCell;
