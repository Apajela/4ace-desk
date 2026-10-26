# 4Ace Desk - Project Site Management & EMS

A full-stack, offline-ready Project Site Management & EMS built for client, site, foremen and labor management.

## Features
- **Project Command Center**: Multi-site management, budget utilization vs. actuals, labor shift headcount, and material cost tracking.
- **Site Priorities & QA Checklists**: Dual Kanban Board & detailed compliance inspection checkpoints (DOLE DO 13 & National Building Code).
- **Daily Attendance Terminal**: DOLE-standard manpower logging with Overtime, Half-Day, and Absent wage tracking with site engineer verification.
- **Weekly Payroll & Payslips**: Automated 125% regular overtime computation, cash advance (bale) deduction, and single/batch official payslip voucher printing.
- **Expense & Procurement Ledger**: Official Receipts (OR) and invoice tracker with 12% BIR EVAT deduction and categorized disbursements.
- **AI Receipt Scanner**: Optical OCR extraction for hardware store receipts (Wilcon Depot, Petron, SafetyFirst) with line-item detail parsing.
- **Executive Reports & Physical S-Curve**: Financial variance analysis, milestone accomplishment tracking, and safe man-hours logging.

---

## Deploying to Render (Free Web Service)

1. **Connect Repository**:
   - Push this codebase to your GitHub or GitLab repository.
   - On the Render Dashboard, click **New +** > **Web Service**.
   - Select your repository.

2. **Build & Start Commands**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render assigns this automatically)

3. **Why Blank Screen Previously Happened**:
   - The previous zip had syntax errors (`Import` casing, missing exports, duplicate identifiers, corrupt mock files, and missing relative files), which stopped the frontend JavaScript bundle from executing in the browser.
   - The server was also not bound to `0.0.0.0`, causing port routing issues on Render.
   - All errors have now been resolved, and the build produces a self-contained production bundle in `dist/` served cleanly by Express.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Compile full-stack production build
npm run build

# 4. Run production server
npm start
```
