-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to delete past empty legs
CREATE OR REPLACE FUNCTION delete_past_empty_legs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM "EmptyLegs_"
  WHERE departure_date::date < CURRENT_DATE;
  
  RAISE NOTICE 'Deleted past empty legs records';
END;
$$;

-- Schedule the cron job to run daily at 2 AM UTC
SELECT cron.schedule('delete-past-empty-legs', '0 2 * * *', 'SELECT delete_past_empty_legs();');