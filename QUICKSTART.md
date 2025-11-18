# Quick Start - Supabase Setup

## 🚀 5-Minute Setup

### 1. Create Supabase Project
- Go to https://app.supabase.com
- Click "New Project"
- Fill in details and wait ~2 minutes

### 2. Run SQL Schema
- Open **SQL Editor** in Supabase dashboard
- Copy contents of `supabase-schema.sql`
- Paste and click **Run**

### 3. Get Credentials
- Go to **Settings** → **API**
- Copy:
  - Project URL
  - anon public key

### 4. Configure .env
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### 5. Start App
```bash
pnpm install
pnpm dev
```

### 6. Test Realtime
- Open app in 2 browser windows
- Click "Connect now" in one window
- See it update in both windows! ✨

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] SQL schema executed successfully
- [ ] `.env` file created with correct values
- [ ] Dev server running without errors
- [ ] Counter increments when clicking
- [ ] Realtime works across multiple windows

## 🆘 Quick Fixes

**Error: Missing environment variables**
→ Restart dev server after creating `.env`

**Error: relation 'counter' does not exist**
→ Run `supabase-schema.sql` in SQL Editor

**Realtime not working**
→ Check Database → Replication → Enable tables

## 📚 Full Documentation

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.
