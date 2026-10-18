# BUYE-Online website

Static site (`site/`) deployed with GitHub Pages. Lead capture backend (`backend/`) is Google Apps Script storing leads in Google Sheets/Drive.

## Brand hierarchy
- Parent company: `assets/buye-parent-branch-logo.png`
- BUYE-Online app and facilities: `assets/buye-online-b-symbol.png`
- Indian Aeronautics: `indian-aeronautics-primary.jpg` (hierarchy), `-icon.png` (division card), `-header.png` (footer)

## 1. Open in VS Code and preview
```bash
cd buye-online
code .
```
Install the recommended "Live Server" extension, right-click `site/index.html` → *Open with Live Server*.

## 2. Backend (Google Apps Script)
Option A, no tools: script.google.com → New project → paste `backend/Code.gs`; in Project Settings tick "Show appsscript.json" and paste `backend/appsscript.json`.

Option B, clasp:
```bash
npm i -g @google/clasp
clasp login
cd backend
clasp create --type standalone --title "BUYE Leads"
clasp push
clasp open
```
Then in the editor:
1. Select `setup` → Run → approve permissions (creates `BUYE_PLATFORM_DATA/` in Drive and the `Leads` sheet).
2. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone** → Deploy. Copy the `/exec` URL.
3. Open the `/exec` URL in a browser: it should show `{"ok":true,...}`.
4. Put the URL in `site/js/config.js` as `ENDPOINT`.

After later code changes, create a **new version** of the deployment (Deploy → Manage deployments → Edit → New version), otherwise the URL serves the old code.

## 3. GitHub
```bash
git init
git add .
git commit -m "Initial BUYE-Online site"
git branch -M main
git remote add origin https://github.com/<you>/buye-online.git
git push -u origin main
```
On GitHub: Settings → Pages → Source: **GitHub Actions**. The workflow in `.github/workflows/pages.yml` publishes `site/` on every push to `main`. The URL will be `https://<you>.github.io/buye-online/`.

## 4. Custom domain (only with approval)
Do not change DNS for `buye.online`, `ielts.buye.online` or `ia.buye.online` until the preview is approved. Test on the github.io URL first, record current DNS records for rollback, then add a CNAME file and DNS record when ready.

## 5. Test checklist
- [ ] Every WhatsApp button opens a chat with +91 99958 63184 with the right prefilled text (phone and desktop).
- [ ] Every email button opens a draft to info@buye.online.
- [ ] Submit the form: a row appears in `BUYE_DATABASE → Leads` and a notification email arrives.
- [ ] Submit again within 60 s: blocked by the cooldown (the page cannot show this; check the sheet).
- [ ] Invalid email / missing consent is rejected on the page.
- [ ] Light and dark mode; mobile, tablet, desktop.

## Known limits
- The browser posts with `mode: no-cors`, so it cannot read the backend's reply. The page shows success if the request was sent, not if it was saved. Check the sheet while testing.
- The endpoint is public by design. Validation, honeypot, cooldown and size limits are the protection; MailApp has daily quotas.
- Not built yet: signup/OTP, user and admin dashboards, roles, audit log, backups.
- Privacy policy and terms pages are still to be written.
