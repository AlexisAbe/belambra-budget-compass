
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";

export function TargetAudienceField({ control }: { control: any }) {
  return (
    <FormField
      control={control}
      name="targetAudience"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cible / Audience</FormLabel>
          <FormControl>
            <Input placeholder="Ex: Familles CSP+" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
