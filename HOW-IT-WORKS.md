# How DashOrg Works

> Enhanced Credential Dashboard

## Daily Check-In System

### When Do Check-Ins Reset?
**Check-ins reset automatically at midnight (12:00 AM) every day in your local timezone.**

The system uses your browser's local time to determine if a check-in was done "today":
- If you check in at 11:59 PM, it counts for that day
- At 12:00 AM (midnight), all check-ins reset and need to be done again
- The "Daily Progress" card shows today's completion rate (0-100%)

### How It Works:
1. **Check In**: Click the "Check In" button on any credential
2. **Tracked**: The system records the exact date and time
3. **Progress**: Your daily progress updates automatically
4. **Reset**: At midnight, all credentials become "unchecked" for the new day
5. **History**: View past check-ins by clicking the "📊 History" button

### Features:

#### ✅ Check-In Tracking
- Each credential can be checked in once per day
- Visual feedback: Cards turn green when checked
- Progress ring shows completion percentage

#### 📊 History
- Click "📊 History" button (next to date) to view past check-ins
- See when you last checked in to each account
- Console log shows detailed history

#### ✏️ Edit Credentials
- Click the ✏️ (edit) icon on any credential card
- Update email, password, label, or notes
- Changes save immediately

#### 🔄 Add to Existing Sites
- When adding credentials, select an existing site from the dropdown
- Or choose "➕ Create New Site" to add a new site
- Helps organize multiple accounts for the same service

#### 💡 Label Suggestions
- When typing a label, suggestions appear from your existing labels
- Helps maintain consistency (e.g., always use "Personal" not "personal" or "Personal Account")
- Shows all existing labels in the hint text

### Daily Reset Logic:

```javascript
// Check if a check-in was done today
isToday(dateString) {
  const today = new Date().toISOString().split('T')[0];  // Today's date
  const checkDate = new Date(dateString).toISOString().split('T')[0];
  return today === checkDate;  // True if same day
}
```

### Tips for Best Use:

1. **Morning Routine**: Check in to accounts right after waking up
2. **Set Reminders**: Use your phone/computer reminders at a specific time
3. **Track Progress**: Watch the progress ring fill up throughout the day
4. **Use Labels**: Organize credentials with consistent labels (Work, Personal, etc.)
5. **View History**: Click History to see your check-in patterns
6. **Edit Anytime**: Update credentials using the ✏️ edit button
7. **Add Gradually**: Don't add all sites at once - start with important ones

### Progress Calculation:

```
Total Credentials: Count of all credentials across all sites
Checked Today: Credentials checked in today (after midnight)
Progress %: (Checked Today / Total Credentials) × 100
```

Example:
- You have 10 credentials total
- You've checked in to 7 today
- Progress: (7/10) × 100 = 70%

### Security Notes:

⚠️ **Important**:
- All data is stored locally in your browser (localStorage)
- No data is sent to any server
- Clear browser data = lose all credentials
- Export your data regularly for backup
- Only use on devices you trust

### Data Storage:

```
Location: Browser localStorage
Key: 'dashorg-state'
Includes:
- Sites (with credentials)
- Check-in timestamps
- Settings
- Categories
```

### Future Enhancements:

Ideas for improvement:
- Calendar view of check-in history
- Weekly/Monthly reports
- Streak tracking (consecutive days checked in)
- Reminders/notifications
- Better history modal with filters
- Export history to CSV

---

**Version**: 2.0.0  
**Last Updated**: 2025-10-22