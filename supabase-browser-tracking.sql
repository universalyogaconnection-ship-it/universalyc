-- Add browser fingerprint tracking to prevent multiple clicks from same computer
-- Run this AFTER supabase-schema.sql

-- Create table to track which browsers have already clicked
CREATE TABLE IF NOT EXISTS user_clicks (
  id BIGSERIAL PRIMARY KEY,
  browser_fingerprint TEXT UNIQUE NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_clicks_fingerprint ON user_clicks(browser_fingerprint);

-- Enable RLS
ALTER TABLE user_clicks ENABLE ROW LEVEL SECURITY;

-- Allow public to read (to check if they've clicked)
CREATE POLICY "Allow public read access to user_clicks"
ON user_clicks FOR SELECT
TO public
USING (true);

-- Allow public to insert (to record their click)
CREATE POLICY "Allow public insert access to user_clicks"
ON user_clicks FOR INSERT
TO public
WITH CHECK (true);

-- Enable realtime for user_clicks
ALTER PUBLICATION supabase_realtime ADD TABLE user_clicks;

-- Add comment
COMMENT ON TABLE user_clicks IS 'Tracks which browsers have clicked to prevent duplicate clicks from same computer';
