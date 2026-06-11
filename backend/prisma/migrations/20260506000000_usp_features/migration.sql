-- USP-Paket: Lohnt-sich-Check, RealSavingAlert, SavedRoutes, VehicleClass

-- Neuer AlertType-Enum
CREATE TYPE "AlertType" AS ENUM ('MAX_PRICE', 'REAL_SAVING');

-- Vehicle: Fahrzeugklasse + Fahrprofil (optional, fuer Verbrauchs-Assistent)
ALTER TABLE "vehicles"
  ADD COLUMN "vehicle_class" TEXT,
  ADD COLUMN "driving_profile" TEXT;

-- PriceAlert: REAL_SAVING-Variante
ALTER TABLE "price_alerts"
  ADD COLUMN "alert_type" "AlertType" NOT NULL DEFAULT 'MAX_PRICE',
  ADD COLUMN "min_real_saving_eur" NUMERIC(6, 2),
  ADD COLUMN "tank_liters" NUMERIC(6, 2),
  ADD COLUMN "consumption_l_per_100km" NUMERIC(5, 2),
  ADD COLUMN "max_extra_distance_km" NUMERIC(5, 2),
  ADD COLUMN "only_open" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX "price_alerts_active_alert_type_idx"
  ON "price_alerts"("active", "alert_type");

-- SavedRoutes: Heimweg-/Arbeitsweg-Modus
CREATE TABLE "saved_routes" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"            UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"               TEXT NOT NULL,
  "start_label"        TEXT NOT NULL,
  "start_lat"          NUMERIC(9, 6) NOT NULL,
  "start_lng"          NUMERIC(9, 6) NOT NULL,
  "end_label"          TEXT NOT NULL,
  "end_lat"            NUMERIC(9, 6) NOT NULL,
  "end_lng"            NUMERIC(9, 6) NOT NULL,
  "fuel_type"          "FuelType" NOT NULL,
  "default_vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "max_detour_km"      NUMERIC(5, 2) NOT NULL DEFAULT 3,
  "active"             BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "saved_routes_user_active_idx"
  ON "saved_routes"("user_id", "active");
