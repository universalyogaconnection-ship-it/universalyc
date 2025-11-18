-- Enhanced Security Schema for Universal Yoga Connection
-- This is an OPTIONAL enhanced version with additional security constraints
-- Run this AFTER the main supabase-schema.sql if you want extra protection

-- Add data validation constraints
ALTER TABLE click_events
ADD CONSTRAINT valid_x_coordinate CHECK (x >= 0 AND x <= 100);

ALTER TABLE click_events
ADD CONSTRAINT valid_y_coordinate CHECK (y >= 0 AND y <= 100);

ALTER TABLE counter
ADD CONSTRAINT positive_count CHECK (count >= 0);

ALTER TABLE counter
ADD CONSTRAINT reasonable_count CHECK (count <= 1000000000); -- 1 billion max

-- Create rate limiting table (optional - for tracking)
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_time 
ON rate_limits(ip_address, created_at DESC);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy for rate_limits (only system can write)
CREATE POLICY "System only access to rate_limits"
ON rate_limits FOR ALL
TO authenticated
USING (false);

-- Function to clean old click events (keep last 1000)
CREATE OR REPLACE FUNCTION cleanup_old_clicks()
RETURNS void AS $$
BEGIN
  DELETE FROM click_events
  WHERE id NOT IN (
    SELECT id FROM click_events
    ORDER BY created_at DESC
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old rate limits (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_clicks() TO postgres;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO postgres;

-- Create a view for counter statistics (optional - useful for monitoring)
CREATE OR REPLACE VIEW counter_stats AS
SELECT 
  c.count as total_clicks,
  c.updated_at as last_update,
  (SELECT COUNT(*) FROM click_events) as total_events,
  (SELECT COUNT(*) FROM click_events WHERE created_at > NOW() - INTERVAL '1 hour') as clicks_last_hour,
  (SELECT COUNT(*) FROM click_events WHERE created_at > NOW() - INTERVAL '1 day') as clicks_last_day,
  (SELECT COUNT(*) FROM click_events WHERE created_at > NOW() - INTERVAL '1 week') as clicks_last_week
FROM counter c
WHERE c.id = 1;

-- Make view readable by public
GRANT SELECT ON counter_stats TO anon;
GRANT SELECT ON counter_stats TO authenticated;

-- Add a trigger to prevent counter from being reset to 0 maliciously
CREATE OR REPLACE FUNCTION prevent_counter_reset()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent setting counter to 0 unless it's the initial setup
  IF NEW.count = 0 AND OLD.count > 0 THEN
    RAISE EXCEPTION 'Counter cannot be reset to zero';
  END IF;
  
  -- Prevent decreasing the counter
  IF NEW.count < OLD.count THEN
    RAISE EXCEPTION 'Counter cannot be decreased';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_counter_reset_trigger
BEFORE UPDATE ON counter
FOR EACH ROW
EXECUTE FUNCTION prevent_counter_reset();

-- Add a trigger to limit click event inserts per second (basic rate limiting)
-- Note: This is a simple approach. For production, use Edge Functions
CREATE OR REPLACE FUNCTION check_insert_rate()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count inserts in last second (very basic rate limiting)
  SELECT COUNT(*) INTO recent_count
  FROM click_events
  WHERE created_at > NOW() - INTERVAL '1 second';
  
  -- Allow max 10 clicks per second globally (adjust as needed)
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Too many clicks per second.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to enable basic rate limiting (may impact performance)
-- CREATE TRIGGER check_insert_rate_trigger
-- BEFORE INSERT ON click_events
-- FOR EACH ROW
-- EXECUTE FUNCTION check_insert_rate();

-- Add comments for documentation
COMMENT ON TABLE counter IS 'Global counter for total connections. Single row with id=1.';
COMMENT ON TABLE click_events IS 'Individual click events with star positions. Auto-cleaned to keep last 1000.';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking table. Auto-cleaned after 1 hour.';
COMMENT ON FUNCTION cleanup_old_clicks() IS 'Removes all but the most recent 1000 click events. Run periodically.';
COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Removes rate limit records older than 1 hour. Run periodically.';
COMMENT ON VIEW counter_stats IS 'Statistics view showing counter metrics and click activity.';

-- Create a function to get counter stats (useful for monitoring)
CREATE OR REPLACE FUNCTION get_counter_stats()
RETURNS TABLE(
  total_clicks BIGINT,
  last_update TIMESTAMP WITH TIME ZONE,
  total_events BIGINT,
  clicks_last_hour BIGINT,
  clicks_last_day BIGINT,
  clicks_last_week BIGINT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM counter_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_counter_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_counter_stats() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced security schema applied successfully!';
  RAISE NOTICE '📊 Counter stats view created';
  RAISE NOTICE '🔒 Data validation constraints added';
  RAISE NOTICE '🧹 Cleanup functions created';
  RAISE NOTICE '⚠️  Remember to schedule cleanup functions in Supabase dashboard';
END $$;
