
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import React from "react";

// Le champ gestionnaire des objectifs marketing dynamiques avec saisie personnalisée
export function MarketingObjectiveField({
  control,
  objectives,
  customObjective,
  setCustomObjective,
  onChangeObjective
}: {
  control: any;
  objectives: string[];
  customObjective: string;
  setCustomObjective: (v: string) => void;
  onChangeObjective: (value: string) => void;
}) {
  return (
    <FormField
      control={control}
      name="marketingObjective"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Objectif Marketing</FormLabel>
          <Select
            onValueChange={(val) => {
              onChangeObjective(val);
              setCustomObjective("");
            }}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner ou saisir un objectif" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {objectives.map((objective) => (
                <SelectItem key={objective} value={objective}>
                  {objective}
                </SelectItem>
              ))}
              <SelectItem value="__custom__">
                <div>
                  <Input
                    placeholder="Ajouter un nouvel objectif"
                    className="w-full"
                    value={customObjective}
                    onChange={e => {
                      setCustomObjective(e.target.value);
                      field.onChange(e.target.value);
                      onChangeObjective(e.target.value);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
