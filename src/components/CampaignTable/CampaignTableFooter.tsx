
import React from "react";
import { Pencil } from "lucide-react";

const CampaignTableFooter: React.FC<{ displayMode: string }> = ({ displayMode }) => (
  <div className="mt-2 text-xs text-gray-500">
    <div className="flex flex-wrap gap-4">
      <span>* Cliquez sur une cellule ou l'icône <Pencil className="inline align-text-bottom w-3 h-3" /> pour modifier les éléments de campagne.</span>
      <span>* Cochez pour sélectionner une ou plusieurs campagnes puis cliquez sur "Supprimer".</span>
      <span>* <span className="bg-blue-50 px-1 rounded">Bleu</span>: Budget prévu {displayMode === 'percentage' ? '(%)' : '(€)'}</span>
      <span>* <span className="bg-green-50 px-1 rounded">Vert</span>: Budget réel</span>
      <span>* Valeurs en <span className="text-red-500">rouge</span>: dépassement</span>
      <span>* Valeurs en <span className="text-green-500">vert</span>: sous-utilisation</span>
    </div>
  </div>
);

export default CampaignTableFooter;
