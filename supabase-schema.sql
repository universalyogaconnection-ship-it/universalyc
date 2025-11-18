-- Universal Yoga Connection - Supabase Schema
-- This schema creates the necessary tables for the realtime counter system

-- Create the counter table (single row to track global count)
CREATE TABLE IF NOT EXISTS counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial counter row
INSERT INTO counter (id, count) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Create the click_events table (stores individual click events for realtime sync)
CREATE TABLE IF NOT EXISTS click_events (
  id BIGSERIAL PRIMARY KEY,
  x DECIMAL(5,2) NOT NULL,
  y DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries on recent clicks
CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON click_events(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Create policies for counter table
-- Allow everyone to read the counter
CREATE POLICY "Allow public read access to counter"
ON counter FOR SELECT
TO public
USING (true);

-- Allow everyone to update the counter
CREATE POLICY "Allow public update access to counter"
ON counter FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Create policies for click_events table
-- Allow everyone to read click events
CREATE POLICY "Allow public read access to click_events"
ON click_events FOR SELECT
TO public
USING (true);

-- Allow everyone to insert click events
CREATE POLICY "Allow public insert access to click_events"
ON click_events FOR INSERT
TO public
WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE counter;
ALTER PUBLICATION supabase_realtime ADD TABLE click_events;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for counter table
CREATE TRIGGER update_counter_updated_at
BEFORE UPDATE ON counter
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
