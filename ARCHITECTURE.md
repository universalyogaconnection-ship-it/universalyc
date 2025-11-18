# Realtime Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CLICKS BUTTON                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL STATE UPDATE                            │
│  • Button shrinks with animation                                 │
│  • Light streak travels to counter                               │
│  • Generate random star position (x, y)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE API CALLS                            │
│                                                                   │
│  1. UPDATE counter SET count = count + 1                         │
│  2. INSERT INTO click_events (x, y)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE REALTIME                             │
│                                                                   │
│  • Broadcasts UPDATE event to all subscribers                    │
│  • Broadcasts INSERT event to all subscribers                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ALL CONNECTED USERS RECEIVE EVENTS                  │
│                                                                   │
│  User A (clicked)    User B (watching)    User C (watching)      │
│      │                    │                     │                │
│      ├────────────────────┼─────────────────────┤                │
│      │                    │                     │                │
│      ▼                    ▼                     ▼                │
│  • Counter: 42 → 43   • Counter: 42 → 43   • Counter: 42 → 43   │
│  • Star appears       • Star appears       • Star appears        │
│  • Glow animation     • Glow animation     • Glow animation      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
App.tsx
├── State Management
│   ├── totalClicks (synced with Supabase)
│   ├── clickedStars (array of {id, x, y})
│   ├── buttonClickAnimation (animation state)
│   └── channelRef (Supabase realtime channel)
│
├── Effects
│   ├── useEffect: Initialize counter from Supabase
│   │   └── Fetch counter.count and click_events
│   │
│   └── useEffect: Subscribe to realtime updates
│       ├── Listen to counter UPDATE events
│       └── Listen to click_events INSERT events
│
├── Event Handlers
│   └── handleClick (async)
│       ├── 1. Animate button shrink
│       ├── 2. Light streak animation
│       ├── 3. Update Supabase counter
│       ├── 4. Insert click event
│       ├── 5. Update local state
│       └── 6. Star glow animation
│
└── Render
    ├── Canvas (Three.js)
    │   ├── Earth component
    │   └── StarField component (renders all stars)
    │
    ├── UI Overlay
    │   ├── Logo
    │   ├── Message text
    │   ├── Connect button
    │   └── Counter display
    │
    └── Animations
        ├── Light streak
        ├── Star glow
        └── Counter increment
```

## Database Schema

```
┌──────────────────────────────────────┐
│            counter                    │
├──────────────────────────────────────┤
│ id          INTEGER (PK) = 1          │
│ count       INTEGER                   │
│ updated_at  TIMESTAMP                 │
└──────────────────────────────────────┘
         │
         │ Realtime: UPDATE events
         │
         ▼
┌──────────────────────────────────────┐
│         All Subscribers               │
│  (All users with app open)            │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│         click_events                  │
├──────────────────────────────────────┤
│ id          BIGSERIAL (PK)            │
│ x           DECIMAL(5,2)              │
│ y           DECIMAL(5,2)              │
│ created_at  TIMESTAMP                 │
└──────────────────────────────────────┘
         │
         │ Realtime: INSERT events
         │
         ▼
┌──────────────────────────────────────┐
│         All Subscribers               │
│  (Receive star position)              │
└──────────────────────────────────────┘
```

## Realtime Subscription Flow

```typescript
// 1. Create channel
const channel = supabase.channel('counter-updates')

// 2. Subscribe to counter updates
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'counter'
}, (payload) => {
  // payload.new contains updated counter data
  setTotalClicks(payload.new.count)
  triggerAnimation()
})

// 3. Subscribe to new clicks
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'click_events'
}, (payload) => {
  // payload.new contains new click event
  const star = {
    id: payload.new.id,
    x: payload.new.x,
    y: payload.new.y
  }
  addStar(star)
  showStarAnimation(star)
})

// 4. Activate subscription
.subscribe()
```

## Animation Timeline

```
User clicks "Connect now"
│
├─ 0ms: Button shrinks
│   └─ setButtonClickAnimation('shrinking')
│
├─ 500ms: Light streak starts
│   └─ setButtonClickAnimation('light-streak')
│
├─ 1500ms: API calls + Counter update
│   ├─ UPDATE counter in Supabase
│   ├─ INSERT click_event in Supabase
│   └─ setButtonClickAnimation('counting')
│
├─ 2300ms: Star glow begins
│   └─ setButtonClickAnimation('star-glow')
│
└─ 3800ms: Animation complete
    └─ setButtonClickAnimation('idle')

Meanwhile, all other users see:
│
├─ ~1500ms: Receive UPDATE event
│   ├─ Counter increments with animation
│   └─ Number slides up
│
└─ ~1500ms: Receive INSERT event
    ├─ New star appears
    └─ Glow animation plays
```

## Performance Optimizations

1. **Progressive Star Loading**
   - Load 1000 stars per frame
   - Prevents UI freezing with thousands of stars

2. **Optimistic Updates**
   - Update local state immediately
   - Sync with server in background
   - Rollback on error (if needed)

3. **Efficient Rendering**
   - Use THREE.Points for star field
   - React.memo for Scene component
   - useMemo for star data generation

4. **Realtime Efficiency**
   - Single channel for all subscriptions
   - Cleanup on unmount
   - Debounced animations

## Security & RLS Policies

```sql
-- Counter table policies
CREATE POLICY "Allow public read access to counter"
ON counter FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update access to counter"
ON counter FOR UPDATE TO public USING (true);

-- Click events table policies
CREATE POLICY "Allow public read access to click_events"
ON click_events FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access to click_events"
ON click_events FOR INSERT TO public WITH CHECK (true);
```

## Scalability Considerations

- **Current**: Suitable for thousands of concurrent users
- **Optimization**: Add rate limiting for production
- **Future**: Consider edge functions for click validation
- **Monitoring**: Track Supabase usage in dashboard
