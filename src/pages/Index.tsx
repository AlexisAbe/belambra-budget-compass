
import React from "react";
import { Link } from "react-router-dom";
import MainNav from "@/components/MainNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-belambra-blue p-2 rounded-lg">
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
          <MainNav />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            to="/clients"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Gestion des Clients</h2>
            <p className="text-gray-600">Accédez à la liste des clients et gérez leurs informations</p>
          </Link>
          
          <Link 
            to="/campaigns"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Gestion des Campagnes</h2>
            <p className="text-gray-600">Suivez et gérez vos campagnes marketing</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
