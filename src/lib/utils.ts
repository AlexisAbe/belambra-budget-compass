
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateWeekNumber(date: Date): number {
  // Copy date to avoid modifying the original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return weekNo;
}

export function weekNumberToDate(year: number, weekNumber: number): Date {
  // Create a date for January 1st of the given year
  const januaryFirst = new Date(year, 0, 1);
  
  // Get the day of the week for January 1st (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = januaryFirst.getDay();
  
  // Calculate the date of the first day of the first week
  // In ISO 8601, the first week is the week with the first Thursday
  let daysDiff = 1 - dayOfWeek; // Move to Monday of the same week
  if (dayOfWeek > 4 || dayOfWeek === 0) {
    // If January 1st is Friday, Saturday or Sunday, the first week is the next week
    daysDiff += 7;
  }
  
  // Set to the first day of the first week
  const firstWeekStart = new Date(year, 0, daysDiff);
  
  // Add the required number of weeks
  const targetDate = new Date(firstWeekStart);
  targetDate.setDate(firstWeekStart.getDate() + (weekNumber - 1) * 7);
  
  return targetDate;
}
