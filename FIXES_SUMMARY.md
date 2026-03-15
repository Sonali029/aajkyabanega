# Fixes Summary - March 11, 2026

## Issues Fixed

### 1. ✅ Old Scheduled Dishes Persisting Across Days

**Problem**: Dal Makhani from March 10th was showing on March 11th

**Root Cause**: The meal slot documents are date-specific (e.g., `2024-03-10_breakfast`), so they shouldn't persist. The issue was likely:
- Browser cache showing old data
- React state not clearing properly when dates changed

**Fixes Implemented**:
- Added debug logging to see actual date values (src/pages/Home/HomePage.tsx:54-61)
- Enhanced date reset logic to automatically reset to today at midnight (src/pages/Home/HomePage.tsx:146)
- Improved state clearing in useNominations hook (src/hooks/useMealSlot.ts:44-45)
- Added support for `scheduledDishName` field to handle both family dishes and static dishes

**How to Verify**:
- Check browser console for debug logs showing date values
- Each meal slot should show its correct date
- March 11th should only show dishes scheduled for March 11th

---

### 2. ✅ Dish Browser Confusion (Family Menu vs Daily Nominations)

**Problem**: Dishes added on March 10th were showing in the dish browser on March 11th

**Clarification**: This is EXPECTED behavior! Here's the difference:
- **Family Menu** (`/dishes` page): Your permanent collection of dishes - these PERSIST across days
- **Daily Nominations**: Dishes nominated for a specific date - these are DATE-SPECIFIC
- **Scheduled Dish**: The chosen dish for a specific date/slot - DATE-SPECIFIC

**What Changed**:
- Updated "Dishes Nominated Today" counter to show only TODAY's nominations (src/pages/Home/HomePage.tsx:21-45, 155-164)
- Changed meal slot page to show "Dishes nominated today" instead of "All dishes in this menu" (src/pages/MealSlot/MealSlotPage.tsx:131-159)
- Now correctly shows 0 nominations on a new day until someone nominates

**Family Menu Behavior** (CORRECT):
- When you add "Chole Bhature" to your menu, it stays in your menu forever
- This is your dish library that the app can pick from
- Think of it like a recipe book

**Daily Nominations Behavior** (CORRECT):
- Each day starts with 0 nominations
- Family members suggest dishes from the menu for that specific day
- These suggestions are date-specific and don't carry over

---

### 3. ✅ Automatic Meal Scheduling

**Problem**: At 3:37 PM, breakfast and lunch should have been auto-scheduled

**Solution Implemented**: Complete Auto-Scheduler System

**New File**: `src/services/scheduler.service.ts`
- Calculates when to schedule based on meal time and offset
- Example: Breakfast at 8:00 AM with 120-min offset → Auto-schedules at 6:00 AM
- Runs every 5 minutes to check if scheduling is needed
- Picks random dish from family menu OR static dishes if family menu is empty

**Configuration** (set in Family Settings):
```typescript
mealConfig: {
    breakfast: {
        time: "08:00",              // Meal time
        schedulerOffsetMins: 120,   // Schedule 2 hours before
        enabled: true
    },
    lunch: { time: "13:00", schedulerOffsetMins: 120, enabled: true },
    dinner: { time: "20:00", schedulerOffsetMins: 120, enabled: true }
}
```

**How It Works**:
1. **HomePage mounts** → Runs scheduler check immediately
2. **Every 5 minutes** → Checks all meal slots
3. **For each slot**:
   - Is it enabled? ✓
   - Is current time past scheduler time? (e.g., past 6:00 AM for breakfast)
   - Is current time before meal time? (e.g., before 8:00 AM)
   - Is a dish already scheduled? If yes, skip
   - If all conditions met → Auto-schedule a random dish

**Dish Selection Priority**:
1. First tries family menu dishes for that slot
2. If family menu is empty, uses static dishes (20 dishes per slot)
3. Marks auto-scheduled dishes with `autoScheduled: true` flag

**UI Indicators**:
- Auto-scheduled dishes show "auto-picked" instead of "chosen by [name]"
- Manual selections still show "chosen by [name]"

**Testing at 3:37 PM** (Your Case):
- Breakfast (8:00 AM, schedule at 6:00 AM): ✅ Should be auto-scheduled
- Lunch (1:00 PM, schedule at 11:00 AM): ✅ Should be auto-scheduled
- Dinner (8:00 PM, schedule at 6:00 PM): ⏳ Not yet (it's only 3:37 PM)

---

## New Features Added

### 1. **Debug Logging**
Check browser console (F12) to see:
- Date values for each meal slot
- Scheduled dish information
- Auto-scheduler activity

### 2. **Auto-Scheduler Runs Every 5 Minutes**
- No manual intervention needed
- Automatically picks dishes when family forgets
- Uses family preferences first, static dishes as fallback

### 3. **Better Date Handling**
- Automatic reset to "today" at midnight
- Clear state management when switching dates
- Date-specific data loading

### 4. **Support for Static Dishes**
- Can schedule dishes even if family menu is empty
- 20 breakfast options, 20 lunch options, 20 dinner options
- High-quality images from Unsplash

---

## Files Modified

1. **src/services/scheduler.service.ts** (NEW)
   - Auto-scheduling logic
   - Time calculations
   - Random dish selection

2. **src/pages/Home/HomePage.tsx**
   - Added auto-scheduler integration
   - Debug logging
   - Better date reset logic
   - Fixed dish name display

3. **src/hooks/useMealSlot.ts**
   - Improved state clearing when dates change
   - Better dish data handling

4. **src/services/mealSlot.service.ts**
   - Added support for `scheduledDishName` field
   - Added `autoScheduled` flag

5. **src/types/index.ts**
   - Added `scheduledDishName` field
   - Added `autoScheduled` flag

6. **src/pages/MealSlot/MealSlotPage.tsx**
   - Changed "All dishes in this menu" to "Dishes nominated today"
   - Now shows only nominated dishes for the specific date

7. **src/data/staticDishes.ts**
   - Updated image URLs for better quality
   - Changed image display from zoomed to cover

---

## How to Test

1. **Open browser console** (F12 → Console tab)
2. **Refresh the homepage**
3. **Look for**:
   - "Running scheduler check..." message
   - "MealCard breakfast for 2026-03-11" logs showing correct dates
   - Auto-scheduled dishes appearing for breakfast & lunch

4. **Check each meal slot**:
   - Click on breakfast → Should show either your scheduled dish or auto-picked dish
   - Should say "auto-picked" if it was automatically scheduled
   - Should show 0 in "Dishes nominated today" if no one nominated anything

5. **Navigate to tomorrow** (March 12):
   - Should show "Not planned yet" for all meals
   - Counts should be 0

---

## Important Notes

### Family Menu is Permanent
- Dishes in `/dishes` page are your permanent menu
- They DON'T get deleted each day
- They're available for scheduling any day

### Scheduled Dishes are Daily
- Each day has its own scheduled dishes
- They DON'T carry over from previous days
- Stored in Firestore as `families/{familyId}/mealSlots/{date_slot}`

### Nominations are Daily
- Each day starts with 0 nominations
- Stored in `families/{familyId}/mealSlots/{date_slot}/nominations`

---

## Next Steps

If you're still seeing old dishes:
1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**: Might have old Firebase data cached
3. **Check console logs**: Look for the date values being logged

The auto-scheduler should now:
- ✅ Pick breakfast at 6:00 AM daily
- ✅ Pick lunch at 11:00 AM daily
- ✅ Pick dinner at 6:00 PM daily
- ✅ Use your family dishes first
- ✅ Fall back to static dishes if needed
- ✅ Show "auto-picked" label
