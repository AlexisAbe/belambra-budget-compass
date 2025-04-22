import React from "react";
import { useCampaigns } from "@/context/CampaignContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MediaChannelSummary from "./MediaChannelSummary";

const Dashboard = () => {
  const { getChannelSummaries, getObjectiveSummaries, getBudgetSummary } = useCampaigns();
  
  const channelSummaries = getChannelSummaries();
  const objectiveSummaries = getObjectiveSummaries();
  const budgetSummary = getBudgetSummary();
  
  // Prepare data for channel chart
  const channelChartData = channelSummaries.map(summary => ({
    name: summary.channel,
    Prévu: summary.planned,
    Réel: summary.actual,
  }));
  
  // Prepare data for objective chart
  const objectiveChartData = objectiveSummaries.map(summary => ({
    name: summary.objective,
    Prévu: summary.planned,
    Réel: summary.actual,
  }));
  
  // Calculate budget progress percentage
  const progressPercentage = budgetSummary.totalPlanned > 0
    ? (budgetSummary.totalActual / budgetSummary.totalPlanned) * 100
    : 0;

  return (
    <div className="space-y-6">
      <MediaChannelSummary channelSummaries={channelSummaries} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Budget par Levier Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={channelChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `${value/1000}k€`} />
                  <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, undefined]} />
                  <Legend />
                  <Bar dataKey="Prévu" fill="#005F9E" />
                  <Bar dataKey="Réel" fill="#00B2A9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Budget par Objectif Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={objectiveChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `${value/1000}k€`} />
                  <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, undefined]} />
                  <Legend />
                  <Bar dataKey="Prévu" fill="#005F9E" />
                  <Bar dataKey="Réel" fill="#00B2A9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Progression du Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Dépensé: {formatCurrency(budgetSummary.totalActual)}</span>
                <span className="text-sm text-gray-500">Prévu: {formatCurrency(budgetSummary.totalPlanned)}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between items-center text-sm">
                <span>0%</span>
                <span>{progressPercentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
              <div className="mt-4 p-4 rounded-md bg-gray-50 border">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Écart:</span>
                  <span className={budgetSummary.variance > 0 ? "text-red-600 font-semibold" : budgetSummary.variance < 0 ? "text-green-600 font-semibold" : ""}>
                    {budgetSummary.variance > 0 ? "+" : ""}{formatCurrency(budgetSummary.variance)} 
                    ({budgetSummary.variance > 0 ? "+" : ""}{budgetSummary.variancePercentage.toFixed(1)}%)
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {budgetSummary.variance > 0 
                    ? "Attention: Le budget réel dépasse le budget prévu. Une révision des dépenses est recommandée."
                    : budgetSummary.variance < 0
                    ? "Budget sous-investi par rapport au prévisionnel. Une accélération des dépenses peut être envisagée."
                    : "Le budget réel est parfaitement aligné avec le prévisionnel."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
