import type { SourceReference, VehicleSpec } from "@/types/content";

/**
 * Verified Land Cruiser 300 specifications.
 *
 * Add entries only from an official Toyota source (or homologation
 * documents) and record the market each figure applies to. Nothing in the
 * UI should hard-code a specification.
 *
 * Not included yet, because no official Toyota source was found for them:
 * towing capacity and payload (GCC, Australia). Toyota Japan's sheet gives
 * kerb weight and GVW per grade but no towing figure.
 */

const toyotaJapan2025: SourceReference = {
  title: "トヨタ ランドクルーザー“300” 主要諸元表 (Toyota Land Cruiser 300 main specifications), March 2025",
  url: "https://toyota.jp/pages/contents/landcruiser300/004_p_001/pdf/landcruiser300_spec_202503.pdf",
  retrievedAt: "2026-10-15",
  market: "Japan",
};

export const vehicleSpecs: readonly VehicleSpec[] = [
  {
    id: "jp-v35a-engine",
    label: "Petrol engine",
    value: "V35A-FTS, 3.444 L V6 twin-turbo with intercooler",
    grade: "3.5L petrol: ZX, GR SPORT, VX, AX, GX",
    source: toyotaJapan2025,
  },
  {
    id: "jp-v35a-power",
    label: "Maximum power (petrol, net)",
    value: "305 kW (415 PS) at 5,200 rpm",
    grade: "3.5L petrol",
    source: toyotaJapan2025,
  },
  {
    id: "jp-v35a-torque",
    label: "Maximum torque (petrol, net)",
    value: "650 N·m (66.3 kgf·m) at 2,000–3,600 rpm",
    grade: "3.5L petrol",
    source: toyotaJapan2025,
  },
  {
    id: "jp-f33a-engine",
    label: "Diesel engine",
    value: "F33A-FTV, 3.345 L V6 twin-turbo diesel with intercooler",
    grade: "3.3L diesel: ZX, GR SPORT",
    source: toyotaJapan2025,
  },
  {
    id: "jp-f33a-power",
    label: "Maximum power (diesel, net)",
    value: "226 kW (307 PS) at 4,000 rpm",
    grade: "3.3L diesel",
    source: toyotaJapan2025,
  },
  {
    id: "jp-f33a-torque",
    label: "Maximum torque (diesel, net)",
    value: "700 N·m (71.4 kgf·m) at 1,600–2,600 rpm",
    grade: "3.3L diesel",
    source: toyotaJapan2025,
  },
  {
    id: "jp-transmission",
    label: "Transmission",
    value: "Direct Shift-10AT (electronically controlled 10-speed automatic)",
    source: toyotaJapan2025,
  },
  {
    id: "jp-drivetrain",
    label: "Drivetrain",
    value: "Full-time 4WD",
    source: toyotaJapan2025,
  },
];
