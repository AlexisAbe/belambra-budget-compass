
import React from "react";
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

// Define the form schema
const formSchema = z.object({
  mediaChannel: z.string().min(1, "Le levier média est requis"),
  campaignName: z.string().min(1, "Le nom de la campagne est requis"),
  marketingObjective: z.string().min(1, "L'objectif marketing est requis"),
  targetAudience: z.string().min(1, "La cible est requise"),
  startDate: z.string().min(1, "La date de début est requise"),
  totalBudget: z.string().transform((val) => Number(val)),
  durationDays: z.string().transform((val) => Number(val)),
  status: z.string().default("ACTIVE"),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
  onCancel: () => void;
  campaign?: any; // Optional campaign for editing
}

const CampaignForm: React.FC<CampaignFormProps> = ({ onCancel, campaign }) => {
  const { addCampaign, updateCampaign } = useCampaigns();
  const isEditing = !!campaign;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mediaChannel: campaign?.mediaChannel || "",
      campaignName: campaign?.campaignName || "",
      marketingObjective: campaign?.marketingObjective || "",
      targetAudience: campaign?.targetAudience || "",
      startDate: campaign?.startDate || "",
      totalBudget: campaign?.totalBudget?.toString() || "",
      durationDays: campaign?.durationDays?.toString() || "",
      status: campaign?.status || "ACTIVE",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateCampaign({
        ...campaign,
        ...values,
      });
    } else {
      addCampaign({
        mediaChannel: values.mediaChannel,
        campaignName: values.campaignName,
        marketingObjective: values.marketingObjective,
        targetAudience: values.targetAudience,
        startDate: values.startDate,
        totalBudget: values.totalBudget,
        durationDays: values.durationDays,
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
