
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignProvider } from "@/context/CampaignContext";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import CampaignTable from "@/components/CampaignTable";
import { ChartBarIcon, TableIcon } from "lucide-react";
import { useCampaigns } from "@/context/CampaignContext";

// Loading component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-belambra-blue"></div>
    <p className="mt-4 text-gray-600">Chargement des données...</p>
  </div>
);

// Content component to handle loading state
const Content = () => {
  const { loading } = useCampaigns();
  
  if (loading) {
    return <LoadingState />;
  }
  
  return (
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
  );
};

const Index = () => {
  return (
    <CampaignProvider>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Header />
          <Content />
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>Belambra Budget Compass © 2025 - Suivi de budget média</p>
          </footer>
        </div>
      </div>
    </CampaignProvider>
  );
};

export default Index;
