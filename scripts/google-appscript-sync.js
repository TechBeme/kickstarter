/**
 * Sync Supabase view to Google Sheets.
 * Configure script properties:
 * - SUPABASE_URL (e.g., https://your-project.supabase.co)
 * - SUPABASE_KEY (read-only / anon key; do NOT use service role)
 * - SUPABASE_VIEW (optional, default: customer_contacts_view)
 * - SHEET_NAME (optional, default: Data)
 */

function syncSupabaseToSheet() {
  const props = PropertiesService.getScriptProperties();
  const SUPABASE_URL = props.getProperty('SUPABASE_URL');
  const SUPABASE_KEY = props.getProperty('SUPABASE_KEY');
  const VIEW = props.getProperty('SUPABASE_VIEW') || 'customer_contacts_view';
  const SHEET_NAME = props.getProperty('SHEET_NAME') || 'Data';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in Script Properties.');
  }

  const url = `${SUPABASE_URL}/rest/v1/${VIEW}?select=*`;
  const resp = UrlFetchApp.fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error(`Supabase error ${resp.getResponseCode()}: ${resp.getContentText()}`);
  }

  const data = JSON.parse(resp.getContentText());
  if (!data.length) {
    Logger.log('No rows returned from Supabase view.');
    return;
  }

  const headers = Object.keys(data[0]);
  const values = [headers].concat(data.map(row => headers.map(h => row[h] ?? '')));

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sheet.clearContents();
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
}

// Run once to create an hourly trigger (adjust in Triggers UI if needed)
function createTrigger() {
  ScriptApp.newTrigger('syncSupabaseToSheet')
    .timeBased()
    .everyHours(1)
    .create();
}
