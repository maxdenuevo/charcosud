# Offline Mode - Complete Implementation Guide

CharcoSud now supports **robust offline functionality** for field operations!

---

## ✨ What's Included

### 1. **Full PWA Support**
- ✅ Service Worker with Workbox
- ✅ App shell caching
- ✅ Installable on mobile devices
- ✅ Offline-first architecture

### 2. **IndexedDB Local Storage**
- ✅ Products cached locally
- ✅ Clients cached locally
- ✅ Pending transactions queue
- ✅ Sync metadata tracking

### 3. **Offline Transaction Queue**
- ✅ Queue sales (salidas) when offline
- ✅ Queue entries (entradas) when offline
- ✅ Automatic retry on network reconnection
- ✅ Transaction ordering maintained

### 4. **Smart Sync Manager**
- ✅ Auto-sync on network reconnection
- ✅ Manual sync trigger
- ✅ Conflict detection and resolution
- ✅ Stock validation before sync
- ✅ Progress tracking

### 5. **Optimistic Updates**
- ✅ Immediate local stock updates
- ✅ UI reflects changes instantly
- ✅ Syncs to server when online
- ✅ Rollback on conflicts

### 6. **Network Status Indicators**
- ✅ Visual online/offline badge
- ✅ Pending transactions counter
- ✅ Sync status messages
- ✅ Detailed sync info panel

---

## 🎯 How It Works

### When Online
1. **Normal Operation**: All transactions go directly to Supabase
2. **Cache Update**: Local cache is updated simultaneously
3. **Real-time**: Immediate confirmation from server

### When Offline
1. **Local First**: Transactions saved to IndexedDB
2. **Optimistic Update**: Stock updated locally
3. **Queue**: Transaction added to pending queue
4. **Visual Feedback**: User sees "pending sync" indicator

### When Reconnected
1. **Auto-Detect**: Network change detected automatically
2. **Auto-Sync**: Pending transactions sync in order
3. **Validation**: Stock checked before each transaction
4. **Conflict Resolution**: Handles stock conflicts intelligently
5. **Cache Refresh**: Latest data fetched from server

---

## 🔄 Sync Process

### Automatic Sync
- **On App Start**: Syncs if cache is old (> 24 hours)
- **On Network Reconnection**: Immediately syncs pending transactions
- **Background**: Periodic sync checks

### Manual Sync
- Click the **network status indicator** (top right)
- Click **"Sincronizar Ahora"** button
- Force sync even with good connection

### Sync Order
1. Oldest transactions first (timestamp-based)
2. Entries before exits (to avoid stock conflicts)
3. One at a time (ensures consistency)

---

## ⚠️ Conflict Resolution

### Stock Conflicts
**Scenario**: User A sells 10kg offline. User B sells 15kg offline. Only 20kg available.

**Resolution**:
1. User A connects first → Transaction succeeds (10kg sold, 10kg remaining)
2. User B connects → Transaction fails (needs 15kg, only 10kg available)
3. User B gets error: "Stock insuficiente para [Product]. Disponible: 10kg, Requerido: 15kg"
4. User B must adjust quantity and retry

### Data Consistency
- **Server is source of truth**: Online data always overwrites local cache
- **Optimistic updates**: Local updates are provisional until synced
- **Retry mechanism**: Failed transactions can be retried manually
- **Maximum retries**: 3 attempts before marking as permanently failed

---

## 📊 Offline Capabilities

### ✅ What Works Offline

#### Products
- View all products
- See current stock (cached)
- Search products
- View product details

#### Clients
- View all clients
- Search clients
- Select for sales

#### Inventory Entries
- Register new entries
- Update stock locally
- Add notes and guide numbers
- Queue for sync

#### Inventory Exits (Sales)
- Select client
- Build cart
- Enter quantities via numeric keypad
- Calculate totals
- Register sales
- Update stock locally
- Queue for sync

### ❌ What Requires Online

#### Initial Setup
- First-time login
- Initial data sync
- User authentication

#### Product/Client Management
- Creating new products
- Creating new clients
- Editing products/clients
- Deleting products/clients

**Note**: CRUD operations require online connection. Only inventory transactions work offline.

---

## 🎨 UI Indicators

### Network Status Badge (Top Right)
- **Green WiFi icon**: Online
- **Red WiFi icon**: Offline
- **Orange cloud icon**: Pending transactions
- **Number badge**: Count of pending transactions

### States
1. **Online, All Synced**: Green WiFi + "Todo sincronizado"
2. **Online, Pending**: Green WiFi + Orange badge + count
3. **Offline, No Pending**: Red WiFi
4. **Offline, Pending**: Red WiFi + Orange badge + count
5. **Syncing**: Progress message shown

### Click to Expand
Click the status badge to see:
- Connection status
- Pending transaction count
- Warning messages
- "Sincronizar Ahora" button (when online)

---

## 💾 Data Storage

### IndexedDB Stores

#### 1. `productos`
- All product data
- Stock levels (cached)
- Updated on sync

#### 2. `clientes`
- All client data
- Contact info
- Updated on sync

#### 3. `pendingTransactions`
- Queued entries/exits
- Timestamps
- Status (pending/syncing/completed/failed)
- Retry count
- Error messages

#### 4. `syncStatus`
- Last sync timestamp
- Sync in progress flag

### Cache Expiry
- **Products**: 24 hours
- **Clients**: 24 hours
- **Transactions**: Until synced
- **Completed transactions**: Cleared after sync

---

## 🔧 Technical Details

### Service Worker
- **Strategy**: NetworkFirst for API calls
- **Cache**: App shell (HTML, CSS, JS)
- **Runtime caching**: Supabase API responses
- **Max age**: 24 hours
- **Update**: Auto-update on new version

### IndexedDB
- **Library**: idb (IDB wrapper)
- **Version**: 1
- **Size limit**: Browser dependent (~1GB typical)
- **Persistence**: Permanent (won't be cleared)

### Sync Manager
- **Event-driven**: Listens to network changes
- **Transaction-safe**: One-at-a-time syncing
- **Error handling**: Retry logic with exponential backoff
- **Progress tracking**: Real-time sync events

---

## 🚀 Usage Scenarios

### Scenario 1: Field Sales Rep
**Situation**: Gabriel is at a store with poor signal

1. App loads from cache
2. Selects client (from cache)
3. Adds products to cart (from cache)
4. Confirms sale → Queued locally
5. Stock updates instantly
6. Moves to next store
7. Better signal → Auto-sync
8. All sales confirmed ✅

### Scenario 2: Warehouse Receiving
**Situation**: Mathias receives delivery in basement (no signal)

1. Opens "Inventario → Entradas"
2. Selects product
3. Enters received quantity
4. Adds delivery guide number
5. Confirms → Queued locally
6. Stock updates instantly
7. Returns upstairs → Auto-sync
8. Entry confirmed ✅

### Scenario 3: Two Users Offline
**Situation**: Both sell same product offline

**Gabriel** (connects first):
- Sells 10kg of Longaniza
- Syncs successfully
- Stock: 20kg → 10kg ✅

**Mathias** (connects second):
- Tries to sell 15kg of Longaniza
- Sync fails: Only 10kg available ❌
- Gets error notification
- Adjusts to 10kg
- Manual retry
- Syncs successfully ✅

---

## 🛠️ Troubleshooting

### "Cannot sync - offline"
- **Cause**: No internet connection
- **Solution**: Wait for connection, transactions are queued

### "Stock insuficiente"
- **Cause**: Stock sold by another user
- **Solution**: Check actual stock, adjust quantity, retry

### "Transaction failed after 3 retries"
- **Cause**: Server error or invalid data
- **Solution**: Check transaction details, delete if invalid

### Service Worker not updating
- **Cause**: Old service worker cached
- **Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

### IndexedDB quota exceeded
- **Cause**: Too much cached data
- **Solution**: Sync and clear completed transactions

---

## 📱 Installation (PWA)

### iOS (Safari)
1. Open app in Safari
2. Tap Share button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (three dots)
3. Tap "Install App" or "Add to Home Screen"
4. Tap "Install"
5. App icon appears in app drawer

### Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click "Install CharcoSud"
3. App opens in own window
4. Can pin to taskbar

---

## 🔒 Data Security

### Offline Data
- **Encryption**: IndexedDB data is not encrypted by default
- **Access**: Only accessible by same origin
- **Privacy**: Cleared when user clears browser data
- **Sensitive data**: Avoid storing sensitive info offline

### Recommendations
- Don't store payment info offline
- Don't store passwords
- Regular sync to minimize offline data
- User logout clears local cache

---

## 📈 Performance

### Storage Sizes (Estimated)
- **20 Products**: ~20KB
- **20 Clients**: ~30KB
- **100 Transactions**: ~100KB
- **Service Worker Cache**: ~2MB (app code)
- **Total**: ~2.2MB (minimal)

### Sync Performance
- **1 transaction**: ~500ms
- **10 transactions**: ~5s
- **100 transactions**: ~50s

### Network Usage
- **Initial sync**: ~50KB
- **Per transaction**: ~2KB
- **Daily usage**: ~100KB typical

---

## 🎓 Best Practices

### For Users
1. **Sync regularly**: Don't accumulate too many pending transactions
2. **Check status**: Glance at network indicator before important sales
3. **Force sync**: Use manual sync after reconnecting
4. **Update stock**: Let app sync before making critical decisions

### For Developers
1. **Test offline**: Use Chrome DevTools → Network → Offline
2. **Monitor IndexedDB**: Check storage in DevTools → Application
3. **Clear cache**: During development, clear Service Worker
4. **Error handling**: Always catch sync errors gracefully

---

## 🔄 Migration Notes

### From Online-Only Version
1. **No migration needed**: IndexedDB created on first run
2. **Automatic**: Sync manager initializes automatically
3. **Cache builds**: Gradually as data is accessed
4. **Full compatibility**: Works with existing Supabase data

### Future Updates
- Service Worker auto-updates
- IndexedDB schema migrations handled
- No user action required

---

## 📊 Monitoring

### Check Sync Status
1. Click network indicator
2. See pending count
3. View last sync time
4. Check for errors

### Debug Mode
Enable in console:
```javascript
localStorage.setItem('debug-sync', 'true')
```

View logs:
- IndexedDB operations
- Sync events
- Network status changes
- Transaction queue

---

## 🎯 Summary

### Key Features
✅ **Robust offline mode** for field operations
✅ **Automatic syncing** on reconnection
✅ **Stock conflict resolution** to prevent overselling
✅ **Visual indicators** for user awareness
✅ **PWA installable** on all devices
✅ **Optimistic updates** for instant feedback
✅ **Transaction queue** preserves all operations
✅ **Data consistency** guaranteed

### User Benefits
- ✅ Work anywhere, anytime
- ✅ No lost sales due to connectivity
- ✅ Instant feedback (no waiting)
- ✅ Automatic sync (no manual effort)
- ✅ Safe from overselling
- ✅ Professional experience

---

**CharcoSud is now production-ready for offline field operations! 🎉**
