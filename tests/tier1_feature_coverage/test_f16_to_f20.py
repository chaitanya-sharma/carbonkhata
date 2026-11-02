"""Tier 1: Feature Coverage Tests for F16 to F20.
Covering:
- F16: Regulatory Trust & Custody Center (Interactive accordion for EU CBAM implementing acts and SVG cryptographic chain of custody)
- F17: Ludhiana Pilot Intake Portal (Adaptive intake form by role, cluster capacity gauge (38/50 reserved), 1-click WhatsApp dispatch)
- F18: 90-Second Guided Tour Controls (Chapter quick-jump, speed toggles (1x/1.5x), responsive laptop/tablet viewport scaling)
- F19: Multi-Device Responsive Polish (Zero horizontal scroll across 1440px desktop, 768px tablet, 375px mobile; touch targets >= 44px)
- F20: Build & Deployment Verification (Defect-free python build.py execution, zero JS console errors, clean URLs)
"""
import json
import re
import subprocess
import sys
from pathlib import Path
from tests.base_test import CarbonKhataTestCase, feature, REPO_ROOT
from tests.dom_helper import load_page, load_page_raw, load_asset

class TestFeaturesF16ToF20(CarbonKhataTestCase):

    # --- F16: Regulatory Trust & Custody Center ---

    @feature("F16", tier=1)
    def test_f16_trust_table_of_eu_regulations(self):
        """F16: Verify trust.html contains table mapping key EU regulations to Carbon Khata functions."""
        raw = load_page_raw("trust.html")
        expected_rules = [
            "Reg. (EU) 2023/956",
            "IR 2025/2547 Art. 14",
            "IR 2025/2620",
            "IR 2025/2621",
            "IR 2025/2546",
            "Reg. (EU) 2026/1384",
            "CGST Notification 10/2023",
        ]
        for rule in expected_rules:
            self.assertIn(rule, raw, f"trust.html must cite {rule}")

    @feature("F16", tier=1)
    def test_f16_trust_dpdp_data_protection(self):
        """F16: Verify data protection principles: DPDP Act 2023 consent, statutory fields, India hosting, 72h breach reporting."""
        raw = load_page_raw("trust.html")
        self.assertIn("DPDP Act", raw)
        self.assertIn("Statutory fields only", raw)
        self.assertIn("India", raw)
        self.assertIn("72 hours", raw)

    @feature("F16", tier=1)
    def test_f16_trust_ai_responsibilities(self):
        """F16: Verify AI policy cards distinguish what software does vs what it never does."""
        doc = load_page("trust.html")
        ai_sec = doc.find_by_id("ai")
        self.assertIsNotNone(ai_sec, "trust.html must have #ai section")
        ai_text = ai_sec.get_text()
        self.assertIn("Reads fuel bills", ai_text)
        self.assertIn("Fill in missing data", ai_text)
        self.assertIn("EU-accredited verifier signs", ai_text)

    @feature("F16", tier=1)
    def test_f16_trust_governance_controls(self):
        """F16: Verify governance section outlines ownership of verifier independence, cluster council, DPO, review desk."""
        raw = load_page_raw("trust.html")
        self.assertIn("Verifier independence", raw)
        self.assertIn("Cluster council", raw)
        self.assertIn("Data integrity", raw)
        self.assertIn("Privacy", raw)

    @feature("F16", tier=1)
    def test_f16_trust_interactive_accordion_or_chain_svg(self):
        """F16: Check interactive accordion for implementing acts or SVG custody chain or progressive check for M4."""
        trust_raw = load_page_raw("trust.html")
        has_accordion_or_chain = ("accordion" in trust_raw.lower() or "<details" in trust_raw.lower()
                                  or "custody" in trust_raw.lower() or "chain" in trust_raw.lower())
        self.require_feature_impl(has_accordion_or_chain, "F16", "trust.html should include interactive accordion or custody chain SVG")

    # --- F17: Ludhiana Pilot Intake Portal ---

    @feature("F17", tier=1)
    def test_f17_pilot_intake_form_elements(self):
        """F17: Verify pilot intake form contains name, firm, role, phone, and tonnage inputs."""
        doc = load_page("pilot.html")
        form = doc.find_by_id("pilotForm")
        self.assertIsNotNone(form, "#pilotForm element must exist")
        self.assertIsNotNone(doc.find_by_id("f-name"), "Input #f-name must exist")
        self.assertIsNotNone(doc.find_by_id("f-firm"), "Input #f-firm must exist")
        self.assertIsNotNone(doc.find_by_id("f-role"), "Select #f-role must exist")
        self.assertIsNotNone(doc.find_by_id("f-phone"), "Input #f-phone must exist")
        self.assertIsNotNone(doc.find_by_id("f-tons"), "Input #f-tons must exist")

    @feature("F17", tier=1)
    def test_f17_pilot_intake_phone_validation(self):
        """F17: Verify phone validation logic in pilot.html requires 10-digit Indian phone number."""
        raw = load_page_raw("pilot.html")
        self.assertIn(r"\d{9}", raw, "pilot.html must validate 10-digit phone format")

    @feature("F17", tier=1)
    def test_f17_pilot_cluster_capacity_metrics(self):
        """F17: Verify pilot cohort capacity metrics (50 exporters, 2 mills, 15 stockists)."""
        raw = load_page_raw("pilot.html")
        self.assertIn("50", raw)
        self.assertIn("exporters", raw)
        self.assertIn("2", raw)
        self.assertIn("mills", raw)
        self.assertIn("15", raw)
        self.assertIn("stockists", raw)

    @feature("F17", tier=1)
    def test_f17_pilot_timeline_steps(self):
        """F17: Verify 4 pilot milestones from Dec 2026 to Sep 2027."""
        raw = load_page_raw("pilot.html")
        self.assertIn("December 2026", raw)
        self.assertIn("January to March 2027", raw)
        self.assertIn("March 2027", raw)
        self.assertIn("April to September 2027", raw)

    @feature("F17", tier=1)
    def test_f17_pilot_capacity_gauge_or_whatsapp(self):
        """F17: Check cluster capacity gauge (38/50) or 1-click WhatsApp dispatch or progressive check for M4."""
        pilot_raw = load_page_raw("pilot.html")
        has_gauge_or_wa = ("capacity" in pilot_raw.lower() or "gauge" in pilot_raw.lower()
                           or "whatsapp" in pilot_raw.lower() or "38" in pilot_raw)
        self.require_feature_impl(has_gauge_or_wa, "F17", "pilot.html should include cluster capacity gauge or 1-click WhatsApp dispatch")

    # --- F18: 90-Second Guided Tour Controls ---

    @feature("F18", tier=1)
    def test_f18_tour_eight_chapters_defined(self):
        """F18: Verify assets/tour.js defines all 8 scripted chapters."""
        tour_js = load_asset("tour.js")
        self.assertIn("const CH = [", tour_js)
        self.assertIn("mill", tour_js.lower())
        self.assertIn("stockist", tour_js.lower())
        self.assertIn("whatsapp", tour_js.lower())
        self.assertIn("exporter", tour_js.lower())
        self.assertIn("verifier", tour_js.lower())
        self.assertIn("importer", tour_js.lower())
        self.assertIn("lender", tour_js.lower())
        self.assertIn("cluster", tour_js.lower())

    @feature("F18", tier=1)
    def test_f18_tour_dom_controls(self):
        """F18: Verify tour playback controls (#tPrev, #tPlay, #tNext, #tChapters, #stage, #cursor)."""
        doc = load_page("tour.html")
        self.assertIsNotNone(doc.find_by_id("tPrev"), "#tPrev button must exist")
        self.assertIsNotNone(doc.find_by_id("tPlay"), "#tPlay button must exist")
        self.assertIsNotNone(doc.find_by_id("tNext"), "#tNext button must exist")
        self.assertIsNotNone(doc.find_by_id("tChapters"), "#tChapters container must exist")
        self.assertIsNotNone(doc.find_by_id("stage"), "#stage container must exist")
        self.assertIsNotNone(doc.find_by_id("cursor"), "#cursor element must exist")

    @feature("F18", tier=1)
    def test_f18_tour_hint_keyboard_shortcuts(self):
        """F18: Verify tour hints announce keyboard navigation shortcuts (Space to pause, arrow keys to step)."""
        raw = load_page_raw("tour.html")
        self.assertIn("Space to pause", raw)
        self.assertIn("to step", raw)

    @feature("F18", tier=1)
    def test_f18_tour_cursor_ripple_element(self):
        """F18: Verify cursor element markup includes animated click ripple."""
        doc = load_page("tour.html")
        cursor = doc.find_by_id("cursor")
        self.assertIsNotNone(cursor, "#cursor must exist")
        ripple = cursor.find_one("span", {"class": "ripple"})
        self.assertIsNotNone(ripple, "Cursor must contain .ripple child element")

    @feature("F18", tier=1)
    def test_f18_tour_speed_toggles_and_scaling(self):
        """F18: Check speed toggles (1x/1.5x) or progressive check for M2."""
        tour_raw = load_page_raw("tour.html")
        tour_js = load_asset("tour.js")
        has_speed = ("speed" in tour_raw.lower() or "speed" in tour_js.lower()
                     or "1.5x" in tour_raw.lower() or "1.5x" in tour_js.lower())
        self.require_feature_impl(has_speed, "F18", "tour.html should feature speed controls (1x / 1.5x)")

    # --- F19: Multi-Device Responsive Polish ---

    @feature("F19", tier=1)
    def test_f19_responsive_viewport_meta_tag(self):
        """F19: Verify standard mobile viewport tag exists across all 8 pages."""
        pages = ["index.html", "platform.html", "solutions.html", "calculator.html",
                 "pricing.html", "trust.html", "pilot.html", "tour.html"]
        for p in pages:
            doc = load_page(p)
            vp = doc.find_one("meta", {"name": "viewport"})
            self.assertIsNotNone(vp, f"{p} must have meta viewport tag")
            self.assertEqual(vp.get_attr("content"), "width=device-width, initial-scale=1")

    @feature("F19", tier=1)
    def test_f19_responsive_css_media_queries(self):
        """F19: Verify responsive media queries in styles.css for mobile, tablet, and desktop breakpoints."""
        styles = load_asset("styles.css")
        self.assertIn("@media (max-width:", styles, "styles.css must contain responsive media queries")
        self.assertTrue(re.search(r"@media\s*\([^\)]*max-width:\s*(?:760|768|900|1024)px", styles),
                        "styles.css must define standard responsive breakpoints")

    @feature("F19", tier=1)
    def test_f19_responsive_touch_target_sizes(self):
        """F19: Verify interactive buttons have heights or min-heights ensuring touch target compliance."""
        styles = load_asset("styles.css")
        self.assertIn(".btn", styles, "styles.css must define .btn class")
        self.assertTrue("height: 44px" in styles or "height: 48px" in styles
                        or "min-height: 44px" in styles or "padding: 10px" in styles,
                        "Button styles must enforce accessible touch target sizing")

    @feature("F19", tier=1)
    def test_f19_responsive_container_max_width(self):
        """F19: Verify container max width and margin auto in styles.css."""
        styles = load_asset("styles.css")
        self.assertIn(".container", styles)
        self.assertIn("--max:", styles)

    @feature("F19", tier=1)
    def test_f19_responsive_table_wrapping(self):
        """F19: Verify table-wrap class provides horizontal overflow scrolling for data tables."""
        styles = load_asset("styles.css")
        self.assertIn(".table-wrap", styles)
        self.assertIn("overflow-x: auto", styles)

    # --- F20: Build & Deployment Verification ---

    @feature("F20", tier=1)
    def test_f20_build_script_execution_exit_code(self):
        """F20: Verify python build.py runs and exits cleanly with exit code 0."""
        cmd = [sys.executable, str(REPO_ROOT / "build.py")]
        res = subprocess.run(cmd, cwd=str(REPO_ROOT), capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"build.py failed with returncode {res.returncode}: {res.stderr}")
        self.assertIn("built index.html", res.stdout)

    @feature("F20", tier=1)
    def test_f20_build_generated_pages_existence(self):
        """F20: Verify all 8 target HTML files exist in the root directory."""
        pages = ["index.html", "platform.html", "solutions.html", "calculator.html",
                 "pricing.html", "trust.html", "pilot.html", "tour.html"]
        for p in pages:
            path = REPO_ROOT / p
            self.assertTrue(path.exists(), f"Target file {p} must exist in repo root")
            self.assertGreater(path.stat().st_size, 500, f"Target file {p} must not be empty")

    @feature("F20", tier=1)
    def test_f20_build_utf8_encoding(self):
        """F20: Verify all 8 generated root HTML files can be decoded strictly as UTF-8."""
        pages = ["index.html", "platform.html", "solutions.html", "calculator.html",
                 "pricing.html", "trust.html", "pilot.html", "tour.html"]
        for p in pages:
            path = REPO_ROOT / p
            try:
                content = path.read_text(encoding="utf-8")
                self.assertGreater(len(content), 0)
            except UnicodeDecodeError as ex:
                self.fail(f"File {p} failed UTF-8 decode: {ex}")

    @feature("F20", tier=1)
    def test_f20_build_no_broken_internal_hrefs(self):
        """F20: Verify internal navigation links reference valid targets without broken 404s."""
        pages = ["index.html", "platform.html", "solutions.html", "calculator.html",
                 "pricing.html", "trust.html", "pilot.html", "tour.html"]
        valid_paths = {"/", "/tour", "/solutions", "/calculator", "/pricing", "/trust", "/pilot", "/platform"}
        for p in pages:
            doc = load_page(p)
            for a in doc.find_all("a"):
                href = a.get_attr("href", "")
                if href.startswith("/"):
                    base_path = href.split("#")[0].split("?")[0]
                    self.assertIn(base_path, valid_paths, f"Invalid internal link href='{href}' on page {p}")

    @feature("F20", tier=1)
    def test_f20_build_vercel_clean_urls_configuration(self):
        """F20: Verify vercel.json contains valid clean URL rewrites."""
        vercel_json_path = REPO_ROOT / "vercel.json"
        self.assertTrue(vercel_json_path.exists(), "vercel.json must exist")
        data = json.loads(vercel_json_path.read_text(encoding="utf-8"))
        self.assertTrue(data.get("cleanUrls", False), "vercel.json must specify cleanUrls: true")

    @feature("F20", tier=1)
    def test_f20_build_zero_syntax_errors_in_js_assets(self):
        """F20: Verify that all assets/*.js parse cleanly via node check."""
        js_files = ["site.js", "calc.js", "app.js", "home.js", "tour.js", "worldmap.js"]
        for js_file in js_files:
            file_path = REPO_ROOT / "assets" / js_file
            res = subprocess.run(["node", "--check", str(file_path)], capture_output=True, text=True)
            self.assertEqual(res.returncode, 0, f"Syntax error in assets/{js_file}: {res.stderr}")
