
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
  
  // Initialize with zeros
  weeks.forEach(week => {
    weeklyBudgetPercentages[week] = 0;
    weeklyBudgets[week] = 0;
    weeklyActuals[week] = 0;
  });
  
  // Process percentages and calculate budgets
  Object.entries(weekIndices).forEach(([week, index]) => {
    if (index < columns.length) {
      let percentValue = columns[index] || "0";
      percentValue = typeof percentValue === 'string' ? 
        percentValue.replace(/[%\s]/g, '').replace(',', '.') : "0";
      if (percentValue === "") percentValue = "0";
      
      const percentage = parseFloat(percentValue) || 0;
      weeklyBudgetPercentages[week] = percentage;
      totalPercentage += percentage;
      
      const weeklyBudget = (percentage / 100) * totalBudget;
      weeklyBudgets[week] = weeklyBudget;
      
      console.log(`Ligne ${rowNum}, Semaine ${week}: ${percentage}% de ${totalBudget} = ${weeklyBudget}`);
    }
  });
  
  // Normalize percentages if total is not 100%
  if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 1) {
    console.warn(`Ligne ${rowNum}: Total des pourcentages (${totalPercentage}%) différent de 100%. Normalisation appliquée.`);
    Object.keys(weeklyBudgetPercentages).forEach(week => {
      weeklyBudgetPercentages[week] = (weeklyBudgetPercentages[week] / totalPercentage) * 100;
    });
  }
  
  return { weeklyBudgetPercentages, weeklyBudgets, weeklyActuals };
}
