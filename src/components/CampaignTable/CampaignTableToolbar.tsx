
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Percent, Trash2, FileUp, PlusCircle } from "lucide-react";
import { mediaChannels } from "@/types";

interface Props {
  selectedChannel: string;
  setSelectedChannel: (channel: string) => void;
  displayMode: 'amount' | 'percentage';
  toggleDisplayMode: () => void;
  handleDeleteSelected: () => void;
  someSelected: boolean;
  selectedIds: string[];
  setShowImportForm: (b: boolean) => void;
  setShowAddForm: (b: boolean) => void;
}

const CampaignTableToolbar: React.FC<Props> = ({
  selectedChannel,
  setSelectedChannel,
  displayMode,
  toggleDisplayMode,
  handleDeleteSelected,
  someSelected,
  selectedIds,
  setShowImportForm,
  setShowAddForm
}) => (
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
              <SelectItem key={channel} value={channel}>{channel}</SelectItem>
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
);

export default CampaignTableToolbar;
