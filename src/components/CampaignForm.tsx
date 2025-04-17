import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCampaigns } from "@/context/CampaignContext";
import { mediaChannels, marketingObjectives, CampaignStatus } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";

const formSchema = z.object({
  mediaChannel: z.string().min(1, "Le levier média est requis"),
  campaignName: z.string().min(1, "Le nom de la campagne est requis"),
  marketingObjective: z.string().min(1, "L'objectif marketing est requis"),
  targetAudience: z.string().min(1, "La cible est requise"),
  startDate: z.string().min(1, "La date de début est requise"),
  durationMode: z.enum(["days", "endDate"]),
  durationDays: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.string().transform((val) => Number(val)),
  status: z.string().default("ACTIVE"),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
  onCancel: () => void;
  campaign?: any;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ onCancel, campaign }) => {
  const { addCampaign, updateCampaign } = useCampaigns();
  const isEditing = !!campaign;
  const [durationMode, setDurationMode] = useState(campaign?.durationMode || "days");

  const calculateDurationDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mediaChannel: campaign?.mediaChannel || "",
      campaignName: campaign?.campaignName || "",
      marketingObjective: campaign?.marketingObjective || "",
      targetAudience: campaign?.targetAudience || "",
      startDate: campaign?.startDate || "",
      durationMode: campaign?.durationMode || "days",
      durationDays: campaign?.durationDays?.toString() || "",
      endDate: campaign?.endDate || "",
      totalBudget: campaign?.totalBudget?.toString() || "",
      status: campaign?.status || "ACTIVE",
    },
  });

  const onSubmit = (values: FormValues) => {
    const finalDurationDays = values.durationMode === "days" 
      ? parseInt(values.durationDays || "0") 
      : calculateDurationDays(values.startDate, values.endDate || values.startDate);

    if (isEditing) {
      updateCampaign({
        ...campaign,
        ...values,
        durationDays: finalDurationDays,
        endDate: values.durationMode === "endDate" ? values.endDate : undefined,
      });
    } else {
      addCampaign({
        mediaChannel: values.mediaChannel,
        campaignName: values.campaignName,
        marketingObjective: values.marketingObjective,
        targetAudience: values.targetAudience,
        startDate: values.startDate,
        durationMode: values.durationMode,
        durationDays: finalDurationDays,
        endDate: values.durationMode === "endDate" ? values.endDate : undefined,
        totalBudget: values.totalBudget,
        status: values.status as CampaignStatus,
      });
    }
    onCancel();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mediaChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Levier Média</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la Campagne</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Été Famille 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketingObjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectif Marketing</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un objectif" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {marketingObjectives.map((objective) => (
                          <SelectItem key={objective} value={objective}>
                            {objective}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
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
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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

              <FormField
                control={form.control}
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
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Annuler
              </Button>
              <Button type="submit" className="bg-belambra-blue hover:bg-belambra-darkBlue">
                {isEditing ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;
