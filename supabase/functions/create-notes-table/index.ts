// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this setup guide to integrate the Deno runtime and Supabase functions:
// https://deno.land/manual@v1.41.1/examples/supabase-functions

// This edge function creates the notes table in your Supabase database
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  try {
    // Extract authentication details from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create Supabase client using service role key (this has elevated permissions)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { headers: { 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Execute SQL queries to create the notes table
    const { error: createTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
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

        -- Drop existing policy if exists
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
      `
    });

    if (createTableError) {
      console.error('Error creating table:', createTableError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create notes table', 
          details: createTableError 
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notes table created successfully' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: err.message 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-notes-table' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
