
import { weeks } from "@/services/mockData";

export function processWeeklyData(
  columns: string[],
  weekIndices: Record<string, number>,
  totalBudget: number,
  rowNum: number
) {
  const weeklyBudgetPercentages: Record<string, number> = {};
  const weeklyBudgets: Record<string, number> = {};
  const weeklyActuals: Record<string, number> = {};
  let totalPercentage = 0;
  
  // Initialiser avec des zéros
  weeks.forEach(week => {
    weeklyBudgetPercentages[week] = 0;
    weeklyBudgets[week] = 0;
    weeklyActuals[week] = 0;
  });
  
  // Traiter les pourcentages et calculer les budgets
  Object.entries(weekIndices).forEach(([week, index]) => {
    if (index < columns.length) {
      let percentValue = columns[index] || "0";
      
      // Nettoyage et conversion de la valeur
      if (typeof percentValue === 'string') {
        // Supprimer les symboles %, €, espaces, et convertir les virgules en points
        percentValue = percentValue.replace(/[%€\s]/g, '').replace(',', '.');
      }
      
      if (percentValue === "") percentValue = "0";
      
      // Si la valeur est un nombre direct (non pourcentage)
      let percentage = parseFloat(percentValue) || 0;
      
      // Si le budget total existe et que la valeur semble être un montant plutôt qu'un pourcentage
      if (totalBudget > 0 && percentage > 0 && percentage > 10 && !percentValue.includes('%')) {
        // Convertir le montant en pourcentage du budget total
        percentage = (percentage / totalBudget) * 100;
        console.log(`Ligne ${rowNum}, Semaine ${week}: Converti ${percentValue} € en ${percentage.toFixed(1)}% du budget total ${totalBudget} €`);
      }
      
      weeklyBudgetPercentages[week] = percentage;
      totalPercentage += percentage;
      
      const weeklyBudget = (percentage / 100) * totalBudget;
      weeklyBudgets[week] = weeklyBudget;
    }
  });
  
  // Normaliser les pourcentages si le total n'est pas 100%
  if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 1) {
    console.warn(`Ligne ${rowNum}: Total des pourcentages (${totalPercentage.toFixed(1)}%) différent de 100%. Normalisation appliquée.`);
    
    const factor = 100 / totalPercentage;
    Object.keys(weeklyBudgetPercentages).forEach(week => {
      weeklyBudgetPercentages[week] = weeklyBudgetPercentages[week] * factor;
      weeklyBudgets[week] = (weeklyBudgetPercentages[week] / 100) * totalBudget;
    });
  }
  
  return { weeklyBudgetPercentages, weeklyBudgets, weeklyActuals };
}
