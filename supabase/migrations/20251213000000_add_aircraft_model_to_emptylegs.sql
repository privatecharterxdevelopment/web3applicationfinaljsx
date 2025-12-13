-- Add aircraft_model column to EmptyLegs_ table
-- This column will store the specific aircraft model (e.g., "Citation XLS+", "Phenom 300")
-- The existing category/aircraft_type field only stores the category (e.g., "Light Jet", "Super Light Jet")

ALTER TABLE "EmptyLegs_"
ADD COLUMN IF NOT EXISTS aircraft_model TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN "EmptyLegs_"."aircraft_model" IS 'Specific aircraft model name (e.g., Citation XLS+, Phenom 300, Challenger 350)';

-- Optional: Create an index for searching by aircraft model
CREATE INDEX IF NOT EXISTS idx_emptylegs_aircraft_model ON "EmptyLegs_" (aircraft_model);

-- Populate aircraft_model based on category with random model assignments
-- Very Light Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 3)::int
    WHEN 0 THEN 'Citation Mustang'
    WHEN 1 THEN 'Phenom 100'
    WHEN 2 THEN 'Eclipse 500'
    ELSE 'HondaJet'
  END
) WHERE (category ILIKE '%very light%' OR aircraft_type ILIKE '%very light%') AND aircraft_model IS NULL;

-- Super Light Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 3)::int
    WHEN 0 THEN 'Citation M2'
    WHEN 1 THEN 'Phenom 100EV'
    WHEN 2 THEN 'Citation Mustang'
    ELSE 'Cirrus Vision Jet'
  END
) WHERE (category ILIKE '%super light%' OR aircraft_type ILIKE '%super light%') AND aircraft_model IS NULL;

-- Light Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 4)::int
    WHEN 0 THEN 'Citation CJ3+'
    WHEN 1 THEN 'Phenom 300'
    WHEN 2 THEN 'Learjet 45XR'
    WHEN 3 THEN 'Hawker 400XP'
    ELSE 'Citation CJ4'
  END
) WHERE (category ILIKE '%light jet%' OR aircraft_type ILIKE '%light jet%')
  AND category NOT ILIKE '%very light%'
  AND category NOT ILIKE '%super light%'
  AND aircraft_type NOT ILIKE '%very light%'
  AND aircraft_type NOT ILIKE '%super light%'
  AND aircraft_model IS NULL;

-- Midsize Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 4)::int
    WHEN 0 THEN 'Citation XLS+'
    WHEN 1 THEN 'Hawker 800XP'
    WHEN 2 THEN 'Learjet 60XR'
    WHEN 3 THEN 'Citation Latitude'
    ELSE 'Hawker 850XP'
  END
) WHERE (category ILIKE '%midsize%' OR category ILIKE '%mid size%' OR aircraft_type ILIKE '%midsize%' OR aircraft_type ILIKE '%mid size%')
  AND category NOT ILIKE '%super mid%'
  AND aircraft_type NOT ILIKE '%super mid%'
  AND aircraft_model IS NULL;

-- Super Midsize Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 4)::int
    WHEN 0 THEN 'Challenger 350'
    WHEN 1 THEN 'Citation Sovereign+'
    WHEN 2 THEN 'Praetor 500'
    WHEN 3 THEN 'Gulfstream G280'
    ELSE 'Citation X'
  END
) WHERE (category ILIKE '%super mid%' OR aircraft_type ILIKE '%super mid%') AND aircraft_model IS NULL;

-- Heavy Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 4)::int
    WHEN 0 THEN 'Gulfstream G450'
    WHEN 1 THEN 'Challenger 604'
    WHEN 2 THEN 'Falcon 900LX'
    WHEN 3 THEN 'Legacy 650'
    ELSE 'Gulfstream G550'
  END
) WHERE (category ILIKE '%heavy%' OR aircraft_type ILIKE '%heavy%') AND aircraft_model IS NULL;

-- Ultra Long Range Jet models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 3)::int
    WHEN 0 THEN 'Gulfstream G650ER'
    WHEN 1 THEN 'Global 6000'
    WHEN 2 THEN 'Falcon 8X'
    ELSE 'Global 7500'
  END
) WHERE (category ILIKE '%ultra%' OR category ILIKE '%long range%' OR aircraft_type ILIKE '%ultra%' OR aircraft_type ILIKE '%long range%') AND aircraft_model IS NULL;

-- Turboprop models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 3)::int
    WHEN 0 THEN 'King Air 350i'
    WHEN 1 THEN 'Pilatus PC-12'
    WHEN 2 THEN 'TBM 940'
    ELSE 'King Air 250'
  END
) WHERE (category ILIKE '%turboprop%' OR aircraft_type ILIKE '%turboprop%') AND aircraft_model IS NULL;

-- Helicopter models
UPDATE "EmptyLegs_" SET aircraft_model = (
  CASE (random() * 3)::int
    WHEN 0 THEN 'Airbus H145'
    WHEN 1 THEN 'Bell 429'
    WHEN 2 THEN 'Sikorsky S-76'
    ELSE 'AgustaWestland AW139'
  END
) WHERE (category ILIKE '%helicopter%' OR aircraft_type ILIKE '%helicopter%') AND aircraft_model IS NULL;

-- Default for any remaining records without a model
UPDATE "EmptyLegs_" SET aircraft_model = 'Private Jet' WHERE aircraft_model IS NULL;
