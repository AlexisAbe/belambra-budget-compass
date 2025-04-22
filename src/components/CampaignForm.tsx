
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCampaigns } from "@/context/CampaignContext";
import { CampaignStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  MediaChannelField,
} from "./CampaignForm/MediaChannelField";
import {
  MarketingObjectiveField,
} from "./CampaignForm/MarketingObjectiveField";
import {
  TargetAudienceField,
} from "./CampaignForm/TargetAudienceField";
import {
  DatesDurationFields,
} from "./CampaignForm/DatesDurationFields";
import {
  BudgetField,
} from "./CampaignForm/BudgetField";
import {
  FormActions,
} from "./CampaignForm/FormActions";
import { useDynamicObjectives } from "./CampaignForm/useDynamicObjectives";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

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

  // Hook pour gérer objectifs dynamiques
  const {
    objectives: localObjectives,
    customObjective,
    setCustomObjective,
    ensureObjectiveInList
  } = useDynamicObjectives(campaign?.marketingObjective);

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
    // Ajoute la valeur à la liste si besoin
    ensureObjectiveInList(values.marketingObjective);

    const finalDurationDays =
      values.durationMode === "days"
        ? parseInt(values.durationDays || "0")
        : calculateDurationDays(
            values.startDate,
            values.endDate || values.startDate
          );

    if (isEditing) {
      updateCampaign({
        ...campaign,
        ...values,
        durationDays: finalDurationDays,
        endDate:
          values.durationMode === "endDate"
            ? values.endDate
            : undefined,
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
        endDate:
          values.durationMode === "endDate"
            ? values.endDate
            : undefined,
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
              {/* Champs du formulaire */}
              <MediaChannelField control={form.control} />
              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la Campagne</FormLabel>
                    <FormControl>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        placeholder="Ex: Été Famille 2025"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <MarketingObjectiveField
                control={form.control}
                objectives={localObjectives}
                customObjective={customObjective}
                setCustomObjective={setCustomObjective}
                onChangeObjective={ensureObjectiveInList}
              />
              <TargetAudienceField control={form.control} />
              <DatesDurationFields
                control={form.control}
                durationMode={durationMode}
                setDurationMode={setDurationMode}
              />
              <BudgetField control={form.control} />
            </div>
            <FormActions
              onCancel={onCancel}
              isEditing={isEditing}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;
