
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import React from "react";

export function DatesDurationFields({
  control,
  durationMode,
  setDurationMode
}: {
  control: any;
  durationMode: string;
  setDurationMode: (v: string) => void;
}) {
  return (
    <>
      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date de Début</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="durationMode"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Mode de durée</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  setDurationMode(value);
                }}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="days" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Nombre de jours
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="endDate" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Date de fin
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {durationMode === "days" ? (
        <FormField
          control={control}
          name="durationDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée (jours)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de Fin</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
