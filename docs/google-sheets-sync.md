# How to Sync Supabase View with Google Sheets (Apps Script)

Step-by-step guide in English to expose only necessary fields to the client via Google Sheets, using a read-only view + Apps Script.

## 1) Create the view in Supabase
1. Open Supabase SQL Editor.
2. Paste the content from `supabase/views/customer_contacts_view.sql`.
3. Execute the SQL to create/update the view.
4. Ensure that policies (RLS) allow `SELECT` on this view for the read key (ideal: `anon` or a dedicated read user/role).

## 2) Prepare the client's spreadsheet
1. Create/open the spreadsheet in Google Sheets.
2. Note the `SPREADSHEET_ID` (from the URL).
3. Go to Extensions → Apps Script.

## 3) Configure Apps Script
1. Create a new project and replace the code with the content from `scripts/google-appscript-sync.js`.
2. Go to Project Settings → Script properties:
   - Add `SUPABASE_URL` with your project URL (e.g., `https://<project>.supabase.co`).
   - Add `SUPABASE_KEY` with the read key (do not use service role).
   - Optional: `SUPABASE_VIEW` (default: `customer_contacts_view`).
   - Optional: `SHEET_NAME` (default: `Data`).
3. Save the properties.

## 4) Run and authorize
1. In Apps Script, select the `syncSupabaseToSheet` function and click Run.
2. Authorize the script with the spreadsheet's Google account.
3. After the first run, check if the `Data` tab was populated.

## 5) Schedule automatic updates
1. In Apps Script, run the `createTrigger` function once.
2. This creates a time-based trigger (1x/hour). Adjust in the triggers panel if you want a different frequency.

## 6) Security and best practices
- Use a limited read key through the view (RLS) to avoid exposing sensitive data.
- Do not include the service role in the script.
- The view should only contain columns allowed for the client.

## 7) File summary
- View SQL: `supabase/views/customer_contacts_view.sql`
- Apps Script code: `scripts/google-appscript-sync.js`
