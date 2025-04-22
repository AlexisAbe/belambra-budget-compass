
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";

export function BudgetField({ control }: { control: any }) {
  return (
    <FormField
      control={control}
      name="totalBudget"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Budget Total (€)</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="Ex: 50000"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
