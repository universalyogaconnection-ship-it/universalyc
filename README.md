# Universal Yoga Connection 🌍✨

A beautiful, interactive 3D web experience that connects yoga practitioners and like-minded individuals from around the world through a realtime global counter system.

## ✨ Features

- **3D Earth Visualization**: Stunning Three.js-powered Earth with realistic textures and atmosphere
- **Realtime Global Counter**: See live updates as people around the world connect
- **Collaborative Star Field**: Each click creates a star that appears for all users in realtime
- **Smooth Animations**: Beautiful transitions and effects using Framer Motion and GSAP
- **Supabase Integration**: Realtime database synchronization across all connected users

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **3D Graphics**: Three.js + React Three Fiber
- **Animations**: Framer Motion + GSAP
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Realtime Database)
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- A Supabase account (free tier works great!)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd universal-yoga-connection
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   
   Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
   - Create a Supabase project
   - Run the database schema
   - Get your API credentials
   - Configure environment variables

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 🎮 How It Works

### The Experience

1. **Loading**: Beautiful loading animation with progress bar
2. **Earth Animation**: Camera zooms into Earth with smooth easing
3. **Message Reveal**: The Universal Yoga Connection message appears
4. **Connect Button**: Click to join the global community
5. **Realtime Magic**: 
   - Your click increments the global counter
   - A star appears at a random position
   - **All other users see your click in realtime!**
   - Counter updates with smooth animations
   - Stars populate the background

### Realtime Synchronization

The app uses Supabase Realtime to sync data across all users:

- **Counter Updates**: When anyone clicks, everyone sees the count increase
- **Star Creation**: New stars appear for all users simultaneously
- **Persistent State**: All data is stored in Supabase
- **Optimistic Updates**: Immediate local feedback with server sync

## 📁 Project Structure

```
universal-yoga-connection/
├── src/
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── lib/
│   │   └── supabase.ts      # Supabase client configuration
│   └── assets/
│       └── logo.png         # Universal Yoga Connection logo
├── public/                  # Static assets
├── supabase-schema.sql      # Database schema
├── supabase-rpc-function.sql # Optional atomic increment function
├── SUPABASE_SETUP.md        # Detailed Supabase setup guide
├── .env.example             # Environment variables template
└── package.json             # Dependencies and scripts
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## 🗄️ Database Schema

### `counter` Table
Stores the global click count:
- `id`: Always 1 (single row)
- `count`: Current total clicks
- `updated_at`: Last update timestamp

### `click_events` Table
Stores individual click events:
- `id`: Auto-incrementing ID
- `x`: Star X position (0-100)
- `y`: Star Y position (0-100)
- `created_at`: Click timestamp

## 🌟 Key Features Explained

### Realtime Updates
```typescript
// Subscribe to counter changes
supabase
  .channel('counter-updates')
  .on('postgres_changes', { 
    event: 'UPDATE', 
    table: 'counter' 
  }, (payload) => {
    // Update UI with new count
  })
  .subscribe()
```

### Atomic Counter Increments
```typescript
// Update counter in Supabase
const { data } = await supabase
  .from('counter')
  .select('count')
  .eq('id', 1)
  .single()

await supabase
  .from('counter')
  .update({ count: data.count + 1 })
  .eq('id', 1)
```

### Star Synchronization
```typescript
// Insert click event
await supabase
  .from('click_events')
  .insert({ x: position.x, y: position.y })

// All users receive this via realtime subscription
```

## 🎨 Customization

### Modify Star Colors
Edit the star color generation in `App.tsx`:
```typescript
// Around line 170-195
if (temperature > 8000) {
  r = 0.6 + Math.random() * 0.2
  g = 0.7 + Math.random() * 0.2
  b = 0.9 + Math.random() * 0.1
}
```

### Change Animation Timing
Adjust animation durations in `handleClick`:
```typescript
setTimeout(() => {
  setButtonClickAnimation('light-streak')
}, 500) // Change this value
```

### Update Earth Textures
Replace texture URLs in the `Earth` component:
```typescript
const dayTexture = useTexture('your-texture-url.jpg')
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env` file exists
- Verify variable names start with `VITE_`
- Restart dev server after changes

### Realtime not working
- Check Supabase dashboard → Database → Replication
- Ensure tables are enabled for realtime
- Verify RLS policies are set up correctly

### Counter not incrementing
- Check browser console for errors
- Verify Supabase credentials
- Check Network tab for failed requests

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for more troubleshooting tips.

## 🔒 Security Considerations

The current setup allows public read/write access for the counter and click events. This is intentional for this use case.

For production, consider:
- Rate limiting (Supabase Edge Functions)
- User authentication
- Click fraud prevention
- Database backups

## 📈 Performance

- **Progressive Star Loading**: Stars load incrementally to prevent freezing
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Efficient Rendering**: Uses THREE.Points for thousands of stars
- **Memoization**: React.memo prevents unnecessary re-renders

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Universal Yoga Connection community
- Three.js for amazing 3D capabilities
- Supabase for realtime infrastructure
- React Three Fiber for React integration

## 📞 Support

For issues or questions:
1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Review browser console errors
3. Check Supabase dashboard logs
4. Open an issue on GitHub

---

**Made with ❤️ for the global yoga community**

*The Universal Symbol of Yoga stands for Peace, Love, Compassion, Forgiveness, Acceptance, Equality and all that is good.*
