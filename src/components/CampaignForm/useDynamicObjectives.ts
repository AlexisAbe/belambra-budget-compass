
import { useState } from "react";
import { marketingObjectives } from "@/types";

// Gère la liste dynamique d’objectifs marketing (pré-définis + personnalisés)
export function useDynamicObjectives(initialObjective?: string) {
  const [objectives, setObjectives] = useState<string[]>([...marketingObjectives]);
  const [customObjective, setCustomObjective] = useState<string>("");

  // Ajoute un objectif personnalisé à la liste locale si ce n’est pas déjà présent
  function ensureObjectiveInList(objective: string) {
    if (
      objective &&
      !objectives.some((obj) => obj.toLowerCase() === objective.toLowerCase())
    ) {
      setObjectives((prev) => [...prev, objective]);
    }
  }

  return {
    objectives,
    setObjectives,
    customObjective,
    setCustomObjective,
    ensureObjectiveInList,
  };
}
