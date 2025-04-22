
import React from "react";
import { formatCurrency } from "@/lib/utils";

interface CampaignCellProps {
  type: 'planned' | 'actual' | 'percentage';
  value: number;
  isEditing: boolean;
  editValue: string;
  onClick: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEditValueChange: (value: string) => void;
  displayMode?: 'amount' | 'percentage';
}

const CampaignCell: React.FC<CampaignCellProps> = ({
  type,
  value,
  isEditing,
  editValue,
  onClick,
  onBlur,
  onKeyDown,
  onEditValueChange,
  displayMode = 'amount'
}) => {
  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className="w-full text-center outline-none"
      />
    );
  }

  if (type === 'percentage' && displayMode === 'percentage') {
    return (
      <div 
        className="text-xs text-gray-500 p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
        onClick={onClick}
      >
        {value > 0 ? value.toFixed(1) : "0"}%
      </div>
    );
  }

  const bgClass = type === 'planned' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-green-50 hover:bg-green-100';
  
  return (
    <div className={`p-1 rounded cursor-pointer ${bgClass}`} onClick={onClick}>
      <div>
        <div className="text-xs text-gray-500">{type === 'planned' ? 'Prévu' : 'Réel'}</div>
        <div className={type === 'actual' && value > 0 ? 'text-red-600' : ''}>
          {value > 0 ? formatCurrency(value) : "-"}
        </div>
      </div>
    </div>
  );
};

export default CampaignCell;
