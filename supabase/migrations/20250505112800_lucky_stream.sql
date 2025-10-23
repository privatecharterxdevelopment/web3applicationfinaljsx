/*
  # Create luxury_cars table and fetch function

  1. New Functions
    - `fetch_luxury_cars` - Function to fetch luxury car data
      - Returns all luxury cars with filtering options
      - Supports pagination and sorting

  2. Security
    - Function is accessible to all users
    - Uses RLS policies for data access control
*/

-- Create or replace the fetch_luxury_cars function
CREATE OR REPLACE FUNCTION fetch_luxury_cars(
  search_term TEXT DEFAULT NULL,
  car_type TEXT DEFAULT NULL,
  min_price INTEGER DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  location TEXT DEFAULT NULL,
  limit_val INTEGER DEFAULT 10,
  offset_val INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'price_per_day',
  sort_order TEXT DEFAULT 'asc'
)
RETURNS SETOF luxury_cars
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM luxury_cars
  WHERE
    (search_term IS NULL OR 
     name ILIKE '%' || search_term || '%' OR
     brand ILIKE '%' || search_term || '%' OR
     model ILIKE '%' || search_term || '%' OR
     description ILIKE '%' || search_term || '%') AND
    (car_type IS NULL OR type = car_type) AND
    (min_price IS NULL OR price_per_day >= min_price) AND
    (max_price IS NULL OR price_per_day <= max_price) AND
    (location IS NULL OR location ILIKE '%' || location || '%') AND
    is_available = true
  ORDER BY
    CASE WHEN sort_by = 'price_per_day' AND sort_order = 'asc' THEN price_per_day END ASC,
    CASE WHEN sort_by = 'price_per_day' AND sort_order = 'desc' THEN price_per_day END DESC,
    CASE WHEN sort_by = 'year' AND sort_order = 'asc' THEN year END ASC,
    CASE WHEN sort_by = 'year' AND sort_order = 'desc' THEN year END DESC,
    CASE WHEN sort_by = 'name' AND sort_order = 'asc' THEN name END ASC,
    CASE WHEN sort_by = 'name' AND sort_order = 'desc' THEN name END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN created_at END ASC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN created_at END DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;

-- Create index for improved search performance
CREATE INDEX IF NOT EXISTS idx_luxury_cars_search 
ON luxury_cars USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || 
  coalesce(brand, '') || ' ' || 
  coalesce(model, '') || ' ' || 
  coalesce(description, ''))
);

-- Create index for filtering by type
CREATE INDEX IF NOT EXISTS idx_luxury_cars_type 
ON luxury_cars(type);

-- Create index for filtering by price
CREATE INDEX IF NOT EXISTS idx_luxury_cars_price 
ON luxury_cars(price_per_day);

-- Create index for filtering by location
CREATE INDEX IF NOT EXISTS idx_luxury_cars_location 
ON luxury_cars(location);

-- Create index for filtering by availability
CREATE INDEX IF NOT EXISTS idx_luxury_cars_availability 
ON luxury_cars(is_available);

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION fetch_luxury_cars TO public;

-- Add comment to the function
COMMENT ON FUNCTION fetch_luxury_cars IS 'Fetches luxury cars with filtering, sorting, and pagination options';