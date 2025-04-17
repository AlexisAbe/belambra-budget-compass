
import React from "react";
import { CampaignProvider } from "@/context/CampaignContext";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import CampaignTable from "@/components/CampaignTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartBarIcon, TableIcon } from "lucide-react";

const CampaignsPage = () => {
  return (
    <CampaignProvider>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Header />
          
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" className="flex items-center">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center">
                <TableIcon className="w-4 h-4 mr-2" />
                Tableau des Campagnes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
            
            <TabsContent value="campaigns">
              <CampaignTable />
            </TabsContent>
          </Tabs>
          
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>Belambra Budget Compass © 2025 - Suivi de budget média</p>
          </footer>
        </div>
      </div>
    </CampaignProvider>
  );
};

export default CampaignsPage;
