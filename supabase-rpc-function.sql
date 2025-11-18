-- Optional: Create an RPC function for atomic counter increments
-- This prevents race conditions when multiple users click simultaneously
-- Run this in the Supabase SQL Editor after running supabase-schema.sql

CREATE OR REPLACE FUNCTION increment_counter()
RETURNS TABLE(new_count INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE counter 
  SET count = count + 1 
  WHERE id = 1
  RETURNING count INTO updated_count;
  
  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION increment_counter() TO anon;
GRANT EXECUTE ON FUNCTION increment_counter() TO authenticated;
