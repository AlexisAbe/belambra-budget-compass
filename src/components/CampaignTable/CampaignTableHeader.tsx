
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { weeks } from "@/services/mockData";
import { Campaign } from "@/types";

interface Props {
  allFilteredChecked: boolean;
  someSelected: boolean;
  handleSelectAll: (checked: boolean) => void;
  checkboxRef: React.RefObject<HTMLButtonElement>;
  selectedChannel: string;
  campaigns: Campaign[];
  mediaChannels: string[];
  currentWeek: string;
}

const CampaignTableHeader: React.FC<Props> = ({
  allFilteredChecked,
  handleSelectAll,
  checkboxRef,
  currentWeek
}) => (
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
        <th key={week} className={`header-cell min-w-[70px] ${week === currentWeek ? 'bg-belambra-teal' : ''}`}>{week}</th>
      ))}
      <th className="header-cell min-w-[100px]">Total Prévu</th>
      <th className="header-cell min-w-[100px]">Total Réel</th>
      <th className="header-cell min-w-[100px]">Écart</th>
    </tr>
  </thead>
);

export default CampaignTableHeader;
