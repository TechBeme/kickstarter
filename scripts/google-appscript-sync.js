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

  // Friendly headers for the client (mapped from the view)
  const headers = [
    'Creator Name',
    'Email',
    'Email Source',
    'Has Contact Form',
    'Contact Form URL',
    'Creator Websites',
    'Creator Profile URL',
    'Project Names',
    'Project URLs',
    'Project Countries',
    'Project Descriptions',
  ];

  const newRows = data.map(row => [
    row.creator_name ?? '',
    row.email ?? '',
    row.email_source_url ?? '',
    row.has_contact_form ?? false,
    row.contact_form_url ?? '',
    row.creator_websites ?? '',
    // Creator Profile URL with slug fallback to id
    row.creator_slug
      ? `https://www.kickstarter.com/profile/${row.creator_slug}`
      : (row.creator_id ? `https://www.kickstarter.com/profile/${row.creator_id}` : ''),
    row.project_names ?? '',
    row.project_urls ?? '',
    row.project_countries ?? '',
    row.project_blurbs ?? '',
  ]);

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  
  // Ensure headers exist (row 1)
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const existingHeader = headerRange.getValues()[0];
  const headerMissing = existingHeader.every(v => v === '');
  if (headerMissing || headers.some((h, i) => existingHeader[i] !== h)) {
    headerRange.setValues([headers]);
  }

  // Column index map
  const colIdx = {};
  headers.forEach((h, i) => { colIdx[h] = i; });

  // Merge key: Creator Profile URL
  const keyCol = colIdx['Creator Profile URL'];
  const existingKeys = new Set();

  // Read existing keys only (more robust than getLastColumn)
  const usedRows = sheet.getLastRow() - 1;
  if (usedRows > 0) {
    const keyRange = sheet.getRange(2, keyCol + 1, usedRows, 1).getValues();
    keyRange.forEach(([val]) => {
      const key = (val || '').toString().trim();
      if (key) existingKeys.add(key);
    });
  }

  // Append only new rows
  const rowsToAppend = newRows.filter(r => {
    const key = (r[keyCol] || '').toString().trim();
    return key && !existingKeys.has(key);
  });

  if (!rowsToAppend.length) {
    Logger.log('No new rows to append.');
    return;
  }

  // Append rows (one per appendRow to avoid column shift issues)
  rowsToAppend.forEach(r => sheet.appendRow(r));
}

// Run once to create a daily trigger (adjust in Triggers UI if needed)
function createTrigger() {
  ScriptApp.newTrigger('syncSupabaseToSheet')
    .timeBased()
    .everyDays(1)
    .atHour(3) // 03:00 UTC (ensure project timezone is set to UTC)
    .create();
}
