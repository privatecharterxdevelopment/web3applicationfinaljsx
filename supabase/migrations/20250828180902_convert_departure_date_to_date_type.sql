-- Convert departure_date column from text (MM/DD/YYYY) to proper date type
ALTER TABLE "EmptyLegs_" ALTER COLUMN departure_date TYPE DATE USING TO_DATE(departure_date, 'MM/DD/YYYY');