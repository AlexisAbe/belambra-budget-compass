
import { Button } from "@/components/ui/button";
import React from "react";

export function FormActions({
  onCancel,
  isEditing,
}: {
  onCancel: () => void;
  isEditing: boolean;
}) {
  return (
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
  );
}
