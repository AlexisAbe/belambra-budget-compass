
import { mediaChannels } from "@/types";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import React from "react";

export function MediaChannelField({ control }: { control: any }) {
  return (
    <FormField
      control={control}
      name="mediaChannel"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Levier Média</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un levier" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {mediaChannels.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {channel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
