/**
 * Verbrauchs-Schaetzung anhand Fahrzeugklasse + Fahrprofil.
 * Werte aus Master-Prompt §8.2/8.3.
 */

export type VehicleClass =
  | 'compact_small' // Kleinwagen
  | 'compact'        // Kompaktwagen
  | 'midsize'        // Kombi / Mittelklasse
  | 'suv'
  | 'van'            // Transporter
  | 'rv'             // Wohnmobil / grosses Fahrzeug
  | 'custom';        // Eigener Wert

export type DrivingProfile = 'city' | 'mixed' | 'highway';

const BASE_CONSUMPTION_L_PER_100KM: Record<Exclude<VehicleClass, 'custom'>, number> = {
  compact_small: 5.5,
  compact: 6.5,
  midsize: 7.5,
  suv: 9.5,
  van: 11.5,
  rv: 13.5,
};

const TYPICAL_TANK_LITERS: Record<Exclude<VehicleClass, 'custom'>, number> = {
  compact_small: 35,
  compact: 45,
  midsize: 55,
  suv: 60,
  van: 70,
  rv: 90,
};

const DRIVING_PROFILE_FACTOR: Record<DrivingProfile, number> = {
  city: 1.15,    // +15 %
  mixed: 1.0,
  highway: 0.92, // -8 %
};

export function estimateConsumption(cls: VehicleClass, profile: DrivingProfile): number | null {
  if (cls === 'custom') return null;
  const base = BASE_CONSUMPTION_L_PER_100KM[cls];
  const factor = DRIVING_PROFILE_FACTOR[profile];
  return Math.round(base * factor * 10) / 10;
}

export function suggestedTankLiters(cls: VehicleClass): number | null {
  if (cls === 'custom') return null;
  return TYPICAL_TANK_LITERS[cls];
}

export const VEHICLE_CLASSES_DE: Record<Exclude<VehicleClass, 'custom'>, string> = {
  compact_small: 'Kleinwagen',
  compact: 'Kompaktwagen',
  midsize: 'Kombi / Mittelklasse',
  suv: 'SUV',
  van: 'Transporter',
  rv: 'Wohnmobil / großes Fahrzeug',
};

export const DRIVING_PROFILES_DE: Record<DrivingProfile, string> = {
  city: 'Viel Stadtverkehr',
  mixed: 'Gemischt',
  highway: 'Viel Autobahn',
};
