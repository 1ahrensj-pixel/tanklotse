-- TankLotse initial schema
-- Aktiviert PostGIS und legt alle Tabellen + Geography-Spalte für Stationen an.

CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums --------------------------------------------------------------------
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPPORT', 'DEVELOPER', 'READONLY', 'SUPERADMIN');
CREATE TYPE "PremiumStatus" AS ENUM ('NONE', 'ACTIVE', 'GRACE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "FuelType" AS ENUM ('E5', 'E10', 'DIESEL');
CREATE TYPE "PriceStatus" AS ENUM ('OPEN', 'CLOSED', 'NO_PRICES', 'UNKNOWN');
CREATE TYPE "ConsentType" AS ENUM ('TERMS', 'PRIVACY', 'LOCATION', 'PUSH', 'ANALYTICS');
CREATE TYPE "ComplaintType" AS ENUM ('WRONG_PRICE_E5', 'WRONG_PRICE_E10', 'WRONG_PRICE_DIESEL', 'WRONG_STATUS', 'WRONG_NAME', 'WRONG_ADDRESS', 'WRONG_BRAND', 'WRONG_LOCATION', 'OTHER');
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'FORWARDED', 'ACCEPTED', 'REJECTED', 'DUPLICATE');
CREATE TYPE "Platform" AS ENUM ('IOS', 'ANDROID', 'WEB');
CREATE TYPE "SubscriptionProvider" AS ENUM ('APPLE', 'GOOGLE', 'STRIPE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'GRACE', 'PENDING');

-- users --------------------------------------------------------------------
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE,
  "password_hash" TEXT,
  "apple_id" TEXT UNIQUE,
  "google_id" TEXT UNIQUE,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "premium_status" "PremiumStatus" NOT NULL DEFAULT 'NONE',
  "totp_secret" TEXT,
  "totp_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "failed_logins" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);
CREATE INDEX "users_email_idx" ON "users"("email");

-- user_consents
CREATE TABLE "user_consents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "ConsentType" NOT NULL,
  "accepted" BOOLEAN NOT NULL,
  "version" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "user_consents_user_id_type_idx" ON "user_consents"("user_id", "type");

-- refresh_tokens
CREATE TABLE "refresh_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "user_agent" TEXT,
  "ip_prefix" TEXT
);
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- email_tokens (verify, reset)
CREATE TABLE "email_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE,
  "purpose" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "email_tokens_user_id_purpose_idx" ON "email_tokens"("user_id", "purpose");

-- vehicles
CREATE TABLE "vehicles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "fuel_type" "FuelType" NOT NULL,
  "consumption_l_per_100km" NUMERIC(5, 2) NOT NULL,
  "typical_tank_liters" NUMERIC(6, 2) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_commercial" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- stations_cache (PostGIS-Geometrie)
CREATE TABLE "stations_cache" (
  "id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "house_number" TEXT,
  "post_code" TEXT NOT NULL,
  "place" TEXT NOT NULL,
  "lat" NUMERIC(9, 6) NOT NULL,
  "lng" NUMERIC(9, 6) NOT NULL,
  "location" geography(Point, 4326),
  "last_detail_update" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "stations_cache_brand_idx" ON "stations_cache"("brand");
CREATE INDEX "stations_cache_post_code_idx" ON "stations_cache"("post_code");
CREATE INDEX "stations_cache_location_gix" ON "stations_cache" USING GIST("location");

-- Trigger: location automatisch aus lat/lng pflegen
CREATE OR REPLACE FUNCTION update_station_location() RETURNS trigger AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng::float8, NEW.lat::float8), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stations_cache_location_trg
  BEFORE INSERT OR UPDATE OF lat, lng ON "stations_cache"
  FOR EACH ROW EXECUTE FUNCTION update_station_location();

-- station_price_cache
CREATE TABLE "station_price_cache" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "station_id" UUID NOT NULL REFERENCES "stations_cache"("id") ON DELETE CASCADE,
  "fuel_type" "FuelType" NOT NULL,
  "price" NUMERIC(6, 3) NOT NULL,
  "status" "PriceStatus" NOT NULL,
  "is_open" BOOLEAN NOT NULL,
  "source" TEXT NOT NULL,
  "source_timestamp" TIMESTAMPTZ,
  "fetched_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "station_price_cache_station_fuel_fetched_idx"
  ON "station_price_cache"("station_id", "fuel_type", "fetched_at" DESC);

-- favorites
CREATE TABLE "favorites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "station_id" UUID NOT NULL REFERENCES "stations_cache"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "station_id")
);
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- price_alerts
CREATE TABLE "price_alerts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "station_id" UUID REFERENCES "stations_cache"("id") ON DELETE SET NULL,
  "fuel_type" "FuelType" NOT NULL,
  "radius_km" NUMERIC(5, 2),
  "lat" NUMERIC(9, 6),
  "lng" NUMERIC(9, 6),
  "max_price" NUMERIC(6, 3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "days_of_week" JSONB NOT NULL,
  "time_window_start" TEXT,
  "time_window_end" TEXT,
  "last_triggered_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "price_alerts_user_active_idx" ON "price_alerts"("user_id", "active");
CREATE INDEX "price_alerts_active_fuel_idx" ON "price_alerts"("active", "fuel_type");

-- push_tokens
CREATE TABLE "push_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "device_id" TEXT NOT NULL,
  "platform" "Platform" NOT NULL,
  "fcm_token" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "revoked_at" TIMESTAMPTZ,
  UNIQUE("user_id", "device_id")
);
CREATE INDEX "push_tokens_user_idx" ON "push_tokens"("user_id");

-- complaints
CREATE TABLE "complaints" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "station_id" UUID NOT NULL REFERENCES "stations_cache"("id") ON DELETE CASCADE,
  "complaint_type" "ComplaintType" NOT NULL,
  "correction" TEXT,
  "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
  "forwarded_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "complaints_station_idx" ON "complaints"("station_id");
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- api_logs
CREATE TABLE "api_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "status_code" INTEGER NOT NULL,
  "ok" BOOLEAN NOT NULL,
  "duration_ms" INTEGER NOT NULL,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "api_logs_provider_created_idx" ON "api_logs"("provider", "created_at" DESC);
CREATE INDEX "api_logs_ok_created_idx" ON "api_logs"("ok", "created_at" DESC);

-- subscriptions
CREATE TABLE "subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" "SubscriptionProvider" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL,
  "product_id" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions"("user_id", "status");

-- feature_flags
CREATE TABLE "feature_flags" (
  "key" TEXT PRIMARY KEY,
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "description" TEXT,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_logs
CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "metadata" JSONB,
  "ip_prefix" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs"("user_id", "created_at" DESC);
CREATE INDEX "audit_logs_action_created_idx" ON "audit_logs"("action", "created_at" DESC);
