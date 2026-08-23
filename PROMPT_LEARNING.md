# Prompt Learning Log

For every prompt I give you:

1. **Improve my prompt** while keeping my original goal unchanged.
2. Show me **only the improved prompt**.
3. Ask: **"Execute this improved prompt? (YES/NO)"**
4. Do NOT execute until I reply **YES**.
5. After I reply YES, execute the improved prompt.
6. Save only the original prompt and improved prompt in this file.

Format:

## Prompt 1

**Original:**
[my prompt]

**Improved:**
[better prompt]

## Prompt 2

**Original:**
[my prompt]

**Improved:**
[better prompt]

Keep this file short and simple. Do not add explanations, lessons, ratings, or unnecessary text.

---

## Prompt 1

**Original:**
whenever someone signup on website he need to verify his email+ also add yodha logo in authentication page it is not there

**Improved:**
Enforce mandatory email verification for all new user registrations, redirect newly signed-up users to the `/verify-email` screen with a resend verification option, guard unverified logins with an explicit prompt, and ensure the official Yodha Mode logo is properly displayed on the Authentication page.

## Prompt 2

**Original:**
ohk send verification email via my mail yodhamode89@gmail.com and atleast tell user to check their inbox to verify their mail after they signup and previos verification mail sent by supabase giviing saying this site cant be reached

**Improved:**
Configure email delivery from `yodhamode89@gmail.com` using custom Gmail SMTP, update all Supabase auth redirect URLs from `localhost` to `https://yodhamode.cloud/dashboard` to fix the broken verification links, and enhance the post-signup verification screen with clear inbox instructions, a spam folder warning callout, and a 1-click Gmail shortcut button.

## Prompt 3

**Original:**
Implement an 'Explore as Guest' preview mode for Yodha Mode. Unauthenticated users should be able to enter the dashboard from the landing page or auth page and freely browse all features (Today's Workout, Weekly Schedule, Custom Routine, Fuel Player, Music Player, and Calendar View) populated with vibrant demo workout data. When a guest attempts any state-changing action (such as logging a workout set, editing/saving routines, or uploading custom media), intercept the interaction and display a high-converting branded Sign Up / Sign In Modal prompting them to create a free account to save their progress and sync across devices.

**Improved:**
Complete and polish the 'Explore as Guest' preview mode across Yodha Mode so unauthenticated visitors can explore all dashboard features with pre-populated demo data, while intercepting write actions with a branded authentication modal.
