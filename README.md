# Carbon Khata

Carbon Khata carries a steel mill's verified emissions, lot by lot through stockists, into a verifier-signed EU CBAM file for Indian MSME exporters.

Live site: https://carbonkhata-navy.vercel.app

## Pages
- `/` home · `/platform` live demo (seven roles) · `/solutions` · `/calculator` · `/pricing` · `/trust` · `/pilot`

## Editing
- Page content lives in `pages/*.html`. Shared header and footer live in `partials/`.
- Styles: `assets/styles.css`. CBAM model and shared script: `assets/site.js`. Demo app: `assets/app.js`. Calculator: `assets/calc.js`.
- After editing anything in `pages/` or `partials/`, run `python3 build.py` and commit the generated `.html` files at the root.
- To enable email on the pilot form, set `CONTACT_EMAIL` in `pages/pilot.html`.

Demo firms, lots and invoice numbers are sample data. Rules and prices are real: EU Reg. 2023/956; IR 2025/2546, 2025/2547, 2025/2620, 2025/2621 as amended by 2026/1740; Reg. (EU) 2026/1384; €75.28 per certificate (Q2 2026); €1 = ₹108.

Team Carbon Khata, XLRI Delhi-NCR · Quest EY-Parthenon 2026.
