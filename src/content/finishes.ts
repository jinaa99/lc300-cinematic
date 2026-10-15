import type { FinishId } from "@/content/copy";

export type Finish = {
  id: FinishId;
  /** Base colour of the paint material (linear workflow handles conversion). */
  color: string;
  metalness: number;
  roughness: number;
  clearcoatRoughness: number;
};

/**
 * Studio paint finishes for the 3D model. Look-dev values, not Toyota paint
 * codes; their display names live in the copy (colour.finishes).
 */
export const finishes: readonly Finish[] = [
  { id: "graphite", color: "#3a3d42", metalness: 0.7, roughness: 0.3, clearcoatRoughness: 0.03 },
  { id: "pearl", color: "#e9e7e1", metalness: 0.2, roughness: 0.3, clearcoatRoughness: 0.03 },
  { id: "black", color: "#0d0e10", metalness: 0.5, roughness: 0.35, clearcoatRoughness: 0.03 },
  { id: "silver", color: "#9ea2a6", metalness: 0.6, roughness: 0.26, clearcoatRoughness: 0.03 },
  { id: "bronze", color: "#5e4a37", metalness: 0.7, roughness: 0.32, clearcoatRoughness: 0.03 },
];

export const defaultFinish: Finish = finishes[0];
