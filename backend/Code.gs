/**
 * BUYE-Online lead capture backend (Google Apps Script).
 * Storage: Google Sheets inside a Drive folder. No other database.
 * Run setup() once from the editor, then deploy as a Web app.
 */
var CFG = {
  NOTIFY_EMAIL: 'info@buye.online',
  FOLDER_NAME: 'BUYE_PLATFORM_DATA',
  SUBFOLDERS: ['01_CORE_DATABASE','02_LEAD_ATTACHMENTS','03_USER_DOCUMENTS','04_EXPORTS','05_REPORTS','06_BACKUPS','07_SYSTEM_DOCUMENTATION'],
  SHEET_NAME: 'Leads',
  HEADERS: ['LeadID','CreatedUTC','Name','Email','Phone','Division','Message','Consent','ConsentAtUTC','Source','Status','Priority','AssignedTo','FollowUpDate','LastContactedUTC','Notes','Duplicate'],
  DIVISIONS: ['IELTS and English','Indian Aeronautics','Skills and Professional Development','Other'],
  COOLDOWN_SECONDS: 60,
  DEDUPE_SECONDS: 600
};

/** Run once manually. Safe to re-run: reuses what exists, deletes nothing. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var root = findOrCreateFolder_(DriveApp.getRootFolder(), CFG.FOLDER_NAME);
  CFG.SUBFOLDERS.forEach(function (n) { findOrCreateFolder_(root, n); });
  var core = findOrCreateFolder_(root, '01_CORE_DATABASE');
  var id = props.getProperty('SHEET_ID');
  var ss;
  if (id) { ss = SpreadsheetApp.openById(id); }
  else {
    ss = SpreadsheetApp.create('BUYE_DATABASE');
    DriveApp.getFileById(ss.getId()).moveTo(core);
    props.setProperty('SHEET_ID', ss.getId());
  }
  var sh = ss.getSheetByName(CFG.SHEET_NAME) || ss.insertSheet(CFG.SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, CFG.HEADERS.length).setValues([CFG.HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var def = ss.getSheetByName('Sheet1'); if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  Logger.log('Database ready: ' + ss.getUrl());
}

function doGet() { return json_({ ok: true, service: 'buye-leads', time: new Date().toISOString() }); }

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > 8000) return json_({ ok: false, code: 'TOO_LARGE' });
    var d = JSON.parse(raw);
    if (d.website) return json_({ ok: true });            // honeypot: pretend success
    var v = validate_(d);
    if (v) return json_({ ok: false, code: 'INVALID', field: v });

    var cache = CacheService.getScriptCache();
    var email = d.email.trim().toLowerCase();
    var rl = 'rl:' + hash_(email);
    if (cache.get(rl)) return json_({ ok: false, code: 'RATE_LIMITED' });
    cache.put(rl, '1', CFG.COOLDOWN_SECONDS);
    var dk = 'dd:' + hash_(email + '|' + d.message.trim());
    var dup = !!cache.get(dk);
    cache.put(dk, '1', CFG.DEDUPE_SECONDS);

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var id;
    try {
      var sh = sheet_();
      id = 'L-' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
      var now = new Date().toISOString();
      var dupFlag = dup ? 'Yes' : (existsEmail_(sh, email) ? 'Possible' : '');
      sh.appendRow([id, now, safe_(d.name), safe_(email), safe_(d.phone || ''), safe_(d.division), safe_(d.message), 'YES', now, 'website', 'New', 'Normal', '', '', '', '', dupFlag]);
    } finally { lock.releaseLock(); }

    try {
      MailApp.sendEmail({ to: CFG.NOTIFY_EMAIL, subject: 'New BUYE lead ' + id + ' — ' + d.division,
        body: 'Name: ' + d.name + '\nEmail: ' + email + '\nPhone: ' + (d.phone || '-') + '\nDivision: ' + d.division + '\n\n' + d.message });
    } catch (mailErr) { console.error('notify failed'); }
    return json_({ ok: true, id: id });
  } catch (err) {
    console.error(String(err));
    return json_({ ok: false, code: 'SERVER_ERROR' });
  }
}

function validate_(d) {
  if (!d || typeof d !== 'object') return 'body';
  if (!d.name || d.name.trim().length < 2 || d.name.length > 100) return 'name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email || '') || d.email.length > 120) return 'email';
  if (d.phone && !/^[+0-9 ()-]{6,20}$/.test(d.phone)) return 'phone';
  if (CFG.DIVISIONS.indexOf(d.division) < 0) return 'division';
  if (!d.message || d.message.trim().length < 3 || d.message.length > 1000) return 'message';
  if (!d.consent) return 'consent';
  return null;
}

function sheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Run setup() first');
  return SpreadsheetApp.openById(id).getSheetByName(CFG.SHEET_NAME);
}
function existsEmail_(sh, email) {
  var n = sh.getLastRow(); if (n < 2) return false;
  var col = sh.getRange(2, 4, n - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (String(col[i][0]).toLowerCase() === email) return true;
  return false;
}
// Blocks spreadsheet formula injection.
function safe_(v) { v = String(v == null ? '' : v).trim(); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }
function hash_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s)).slice(0, 32);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function findOrCreateFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
