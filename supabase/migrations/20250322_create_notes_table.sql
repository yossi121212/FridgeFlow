-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  rotate TEXT,
  shadow_height INTEGER,
  shadow_blur INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable row level security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (to avoid errors)
DROP POLICY IF EXISTS "Users can CRUD their own notes" ON notes;

-- Create a policy to allow users to manage their own notes
CREATE POLICY "Users can CRUD their own notes" ON notes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the timestamp
DROP TRIGGER IF EXISTS update_notes_timestamp ON notes;
CREATE TRIGGER update_notes_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 