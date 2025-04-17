
import React from "react";
import Header from "@/components/Header";
import MainNav from "@/components/MainNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListFilter, Users } from "lucide-react";

const Clients = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-belambra-blue p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-belambra-blue">Gestion des Clients</h1>
              <p className="text-gray-500">Suivi et gestion des clients Belambra</p>
            </div>
          </div>
          <MainNav />
        </div>
        
        <Tabs defaultValue="liste">
          <TabsList className="mb-6">
            <TabsTrigger value="liste" className="flex items-center">
              <ListFilter className="w-4 h-4 mr-2" />
              Liste des Clients
            </TabsTrigger>
            <TabsTrigger value="ajouter" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Ajouter un Client
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="liste">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Liste des Clients</h2>
              <p className="text-gray-500 mb-4">Cette section est en cours de développement.</p>
              
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                <p className="text-gray-600">Aucun client n'a encore été ajouté.</p>
                <button 
                  className="mt-4 bg-belambra-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    console.log("Ajout d'un client");
                  }}
                >
                  Ajouter un Client
                </button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ajouter">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Ajouter un Nouveau Client</h2>
              <p className="text-gray-500 mb-4">Formulaire pour ajouter un nouveau client.</p>
              
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Client</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrez le nom du client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrez l'email du client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrez le numéro de téléphone"
                  />
                </div>
                <div className="mt-2">
                  <button 
                    className="bg-belambra-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      console.log("Soumission du formulaire");
                    }}
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Belambra Budget Compass © 2025 - Suivi de budget média</p>
        </footer>
      </div>
    </div>
  );
};

export default Clients;
