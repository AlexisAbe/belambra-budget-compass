
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pause, X } from "lucide-react";
import { Campaign } from "@/types";

interface CampaignStatusProps {
  status: Campaign['status'];
  onStatusChange: (status: Campaign['status']) => void;
}

const CampaignStatus: React.FC<CampaignStatusProps> = ({ status, onStatusChange }) => {
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

  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[120px]">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span>{status}</span>
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
  );
};

export default CampaignStatus;
