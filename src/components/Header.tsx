
import React from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const Header = () => {
  const { getBudgetSummary, currentWeek, resetToMockData } = useCampaigns();
  const summary = getBudgetSummary();
  
  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-red-600";
    if (variance < 0) return "text-green-600";
    return "text-gray-700";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-belambra-blue p-2 rounded-lg mr-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-6 h-6 text-white"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-belambra-blue">Belambra Budget Compass</h1>
            <p className="text-gray-500">Suivi des campagnes digitales 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-belambra-lightBlue py-1 px-3 rounded-full text-white text-sm font-medium">
            Semaine actuelle: {currentWeek}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToMockData}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Budget total planifié</p>
          <p className="text-xl font-bold">{formatCurrency(summary.totalPlanned)}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Budget dépensé</p>
          <p className="text-xl font-bold">{formatCurrency(summary.totalActual)}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Écart</p>
          <p className={`text-xl font-bold ${getVarianceColor(summary.variance)}`}>
            {summary.variance > 0 ? "+" : ""}{formatCurrency(summary.variance)}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Écart (%)</p>
          <p className={`text-xl font-bold ${getVarianceColor(summary.variance)}`}>
            {summary.variance > 0 ? "+" : ""}
            {summary.variancePercentage.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
