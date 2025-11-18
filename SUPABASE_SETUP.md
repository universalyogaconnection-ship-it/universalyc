# Supabase Setup Guide for Universal Yoga Connection

This guide will help you set up Supabase for the realtime counter system.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and pnpm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - **Name**: universal-yoga-connection (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Set Up the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the SQL
6. You should see success messages for:
   - `counter` table created
   - `click_events` table created
   - Row Level Security (RLS) policies created
   - Realtime enabled for both tables

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** under Project Settings
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Environment Variables

1. In your project root, create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Never commit your `.env` file to git! It's already in `.gitignore`.

## Step 5: Verify the Setup

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Open your browser to `http://localhost:5173`

3. Check the browser console for any errors

4. Try clicking the "Connect now" button - you should see:
   - The counter increment
   - A new star appear
   - The data persist in Supabase

## Step 6: Test Realtime Functionality

1. Open your app in **two different browser windows** (or use incognito mode)
2. Click the "Connect now" button in one window
3. You should see:
   - The counter update in **both windows** simultaneously
   - The star animation appear in **both windows**
   - This confirms realtime is working!

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure you created the `.env` file
- Verify the variable names start with `VITE_`
- Restart your dev server after creating/modifying `.env`

### Error: "relation 'counter' does not exist"
- You need to run the SQL schema from `supabase-schema.sql`
- Go to SQL Editor in Supabase dashboard and run the schema

### Realtime not working
- Check that realtime is enabled in Supabase:
  - Go to **Database** → **Replication** in your Supabase dashboard
  - Ensure `counter` and `click_events` tables are enabled
- Verify RLS policies are set up correctly

### Counter not incrementing
- Check browser console for errors
- Verify your Supabase credentials are correct
- Check the Network tab to see if API calls are succeeding

## Database Schema Overview

### `counter` table
- Stores the global click count
- Single row with `id = 1`
- Auto-updates `updated_at` timestamp

### `click_events` table
- Stores individual click events
- Each row represents one user click
- Contains `x` and `y` coordinates for star positions
- Used to display stars for all users

## Security Notes

- The current setup allows **public read and write** access
- This is intentional for this use case (global counter)
- For production, consider:
  - Rate limiting (use Supabase Edge Functions)
  - Adding user authentication
  - Implementing click fraud prevention

## Optional: Create an RPC Function for Atomic Increment

For better performance, you can create a PostgreSQL function:

```sql
CREATE OR REPLACE FUNCTION increment_counter()
RETURNS void AS $$
BEGIN
  UPDATE counter SET count = count + 1 WHERE id = 1;
END;
$$ LANGUAGE plpgsql;
```

Then update the code to use:
```typescript
await supabase.rpc('increment_counter')
```

This ensures atomic increments without race conditions.

## Next Steps

- Monitor your Supabase dashboard for usage
- Set up database backups
- Consider upgrading to a paid plan for production use
- Add analytics to track engagement

## Support

If you encounter issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Visit the Supabase Discord: https://discord.supabase.com
3. Review the browser console for detailed error messages
