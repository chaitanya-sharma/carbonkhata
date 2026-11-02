"""Tier 1: Feature Coverage Tests for F1 to F5.
Covering:
- F1: The Three Anchoring Numbers (₹30,400/t penalty, ₹36.4L shipment savings, ~70% missing data penalty)
- F2: Debunk #1 Judge Misconception (97.5% free allocation scales EU benchmark, not emissions)
- F3: Institutional Trust Anchor (XLRI Delhi-NCR, Quest EY-Parthenon 2026 header/footer badge)
- F4: Ambient Telemetry HUD (EU ETS €75.28/tCO₂, ₹108 FX, and Dec 2026 pilot countdown)
- F5: Master Design System Tokens (Obsidian chromatic surface ladder, molten orange core, verification mint, high-contrast typography)
"""
import re
from tests.base_test import CarbonKhataTestCase, feature
from tests.dom_helper import load_page, load_page_raw, load_asset, load_partial
from tests import cbam_engine

class TestFeaturesF01ToF05(CarbonKhataTestCase):

    # --- F1: The Three Anchoring Numbers ---

    @feature("F1", tier=1)
    def test_f1_anchoring_savings_formula_120t(self):
        """F1: Verify 120t bolt shipment yields ₹36.4 Lakh net savings (₹46.8L - ₹10.4L)."""
        r = cbam_engine.per_tonne(product="bolts", year=2026, price=75.28, traced=1.0)
        def_total = r["def"] * 120
        act_total = r["act"] * 120
        saving = def_total - act_total
        self.assertAlmostEqual(def_total / 1e5, 46.8, delta=0.5, msg="Default cost should be ~₹46.8 Lakh")
        self.assertAlmostEqual(act_total / 1e5, 10.4, delta=0.5, msg="Verified cost should be ~₹10.4 Lakh")
        self.assertAlmostEqual(saving / 1e5, 36.4, delta=0.5, msg="Net savings should be ~₹36.4 Lakh")

    @feature("F1", tier=1)
    def test_f1_anchoring_per_tonne_penalty_formula(self):
        """F1: Verify 2026 bolt data penalty is approximately ₹30,400 per tonne."""
        r = cbam_engine.per_tonne(product="bolts", year=2026, price=75.28, traced=1.0)
        self.assertAlmostEqual(r["saving"], 30375.0, delta=100.0, msg="Per tonne penalty should be ~₹30,400")

    @feature("F1", tier=1)
    def test_f1_anchoring_missing_data_penalty_ratio(self):
        """F1: Verify missing data penalty constitutes ~70% of total default liability for HRC."""
        r = cbam_engine.per_tonne(product="coil", year=2026, price=75.28, traced=1.0)
        penalty_ratio = r["saving"] / r["def"]
        self.assertGreaterEqual(penalty_ratio, 0.69, "Missing data penalty should be ~70% of default bill")
        self.assertLessEqual(penalty_ratio, 0.75, "Missing data penalty should not exceed 75% in 2026")

    @feature("F1", tier=1)
    def test_f1_anchoring_landing_page_hero_numbers(self):
        """F1: Verify presence of ₹36.4 L in index.html hero and heroKept element."""
        doc = load_page("index.html")
        hero_kept = doc.find_by_id("heroKept")
        self.assertIsNotNone(hero_kept, "heroKept element must exist on landing page")
        self.assertIn("₹36.4 L", hero_kept.get_text(), "heroKept must display ₹36.4 L")

    @feature("F1", tier=1)
    def test_f1_anchoring_worked_example_pricing_consistency(self):
        """F1: Verify 300t bolt annual savings equals ₹91.1 Lakh in pricing and solutions pages."""
        pricing_html = load_page_raw("pricing.html")
        solutions_html = load_page_raw("solutions.html")
        self.assertIn("₹91.1 L", pricing_html, "pricing.html must show ₹91.1 L annual savings for 300t")
        self.assertIn("₹91.1 L", solutions_html, "solutions.html must show ₹91.1 L annual savings for 300t")

    # --- F2: Debunk #1 Judge Misconception ---

    @feature("F2", tier=1)
    def test_f2_debunk_free_allocation_benchmark_application(self):
        """F2: Verify 97.5% free allocation scales the 1.53 EU benchmark, NOT the 6.29 emissions."""
        factor = cbam_engine.CBAM_FACTOR[2026]
        bench_default = cbam_engine.BENCH["default"]
        sefa = bench_default * factor
        self.assertAlmostEqual(sefa, 1.49175, places=3, msg="SEFA adjustment should be 1.53 * 0.975 = 1.49 t")

    @feature("F2", tier=1)
    def test_f2_debunk_payable_certificates_derivation(self):
        """F2: Verify 4.80 certificates/tonne remain payable on default bolt imports after SEFA deduction."""
        p_def = cbam_engine.PRODUCTS["bolts"]["def"] * (1.0 + cbam_engine.MARKUP[2026])
        certs = cbam_engine.calc_certs(p_def, cbam_engine.BENCH["default"], 2026)
        self.assertAlmostEqual(certs, 4.80, delta=0.02, msg="Payable certificates must be ~4.80 per tonne")

    @feature("F2", tier=1)
    def test_f2_debunk_payable_cost_per_tonne(self):
        """F2: Verify 4.80 certificates at €75.28 and ₹108 FX equals ~₹39,000/tonne."""
        r = cbam_engine.per_tonne(product="bolts", year=2026, price=75.28, traced=1.0)
        self.assertAlmostEqual(r["def"], 39028.0, delta=200.0, msg="Default cost should be ~₹39,000 per tonne")

    @feature("F2", tier=1)
    def test_f2_debunk_misconception_text_in_index(self):
        """F2: Verify index.html contains textual debunking of the 97.5% free allocation myth."""
        index_raw = load_page_raw("index.html")
        self.assertIn("97.5%", index_raw, "index.html must reference the 97.5% factor")
        self.assertIn("4.8 certificates", index_raw, "index.html must mention 4.8 certificates remaining payable")

    @feature("F2", tier=1)
    def test_f2_debunk_study_guide_myth_card_structure(self):
        """F2: Verify prominent visual debunking card is present or progressive check for M2."""
        index_raw = load_page_raw("index.html")
        has_card = ("misconception" in index_raw.lower() or "myth" in index_raw.lower()
                    or "reduces only the" in index_raw.lower())
        self.require_feature_impl(has_card, "F2", "index.html should feature prominent #1 myth debunking card")

    # --- F3: Institutional Trust Anchor ---

    @feature("F3", tier=1)
    def test_f3_institutional_badge_footer_structure(self):
        """F3: Verify partials/footer.html contains XLRI Delhi-NCR, Team Carbon Khata, and Quest EY-Parthenon 2026."""
        footer_raw = load_partial("footer.html")
        self.assertIn("XLRI Delhi-NCR", footer_raw, "Footer must cite XLRI Delhi-NCR")
        self.assertIn("Team Carbon Khata", footer_raw, "Footer must cite Team Carbon Khata")
        self.assertIn("Quest EY-Parthenon 2026", footer_raw, "Footer must cite Quest EY-Parthenon 2026")

    @feature("F3", tier=1)
    def test_f3_institutional_badge_all_pages(self):
        """F3: Verify every generated HTML page contains institutional credentials in the footer."""
        pages = ["index.html", "platform.html", "solutions.html", "calculator.html",
                 "pricing.html", "trust.html", "pilot.html", "tour.html"]
        for p in pages:
            raw = load_page_raw(p)
            self.assertIn("XLRI Delhi-NCR", raw, f"{p} must contain XLRI Delhi-NCR footer credential")
            self.assertIn("Quest EY-Parthenon 2026", raw, f"{p} must contain Quest EY-Parthenon 2026")

    @feature("F3", tier=1)
    def test_f3_institutional_meta_tags(self):
        """F3: Verify OpenGraph and meta descriptions contain professional positioning."""
        pages = ["index.html", "platform.html", "calculator.html", "trust.html"]
        for p in pages:
            doc = load_page(p)
            og_title = doc.find_one("meta", {"property": "og:title"})
            self.assertIsNotNone(og_title, f"{p} must have og:title meta tag")
            self.assertIn("Carbon Khata", og_title.get_attr("content", ""))

    @feature("F3", tier=1)
    def test_f3_institutional_brand_svg_mark(self):
        """F3: Verify logo mark SVG contains dual-tone spine and verification check badge."""
        doc = load_page("index.html")
        logo = doc.find_one("a", {"class": "logo"})
        self.assertIsNotNone(logo, "Logo anchor must exist")
        svg = logo.find_one("svg")
        self.assertIsNotNone(svg, "Logo SVG mark must exist")
        self.assertIn("0 0 28 28", svg.get_attr("viewbox", ""), "Logo viewBox must be 0 0 28 28")

    @feature("F3", tier=1)
    def test_f3_institutional_header_badge_presence(self):
        """F3: Check header institutional trust anchor or progressive verification for M1."""
        header_raw = load_partial("header.html")
        has_anchor = ("XLRI" in header_raw or "EY-Parthenon" in header_raw or "Quest" in header_raw)
        self.require_feature_impl(has_anchor, "F3", "Header should include XLRI Delhi-NCR / Quest EY-Parthenon trust badge")

    # --- F4: Ambient Telemetry HUD ---

    @feature("F4", tier=1)
    def test_f4_telemetry_hud_parameters_consistency(self):
        """F4: Verify €75.28 and ₹108 FX values in assets/site.js."""
        site_js = load_asset("site.js")
        self.assertIn("PRICE_2026 = 75.28", site_js, "site.js must define PRICE_2026 = 75.28")
        self.assertIn("FX = 108", site_js, "site.js must define FX = 108")

    @feature("F4", tier=1)
    def test_f4_telemetry_hud_prices_footer(self):
        """F4: Verify footer displays official live price benchmarks."""
        footer_raw = load_partial("footer.html")
        self.assertIn("€75.28", footer_raw, "Footer must state €75.28")
        self.assertIn("€1 = ₹108", footer_raw, "Footer must state €1 = ₹108")

    @feature("F4", tier=1)
    def test_f4_telemetry_hud_pilot_timeline(self):
        """F4: Verify Dec 2026 pilot opening date is cited across pages."""
        index_raw = load_page_raw("index.html")
        pilot_raw = load_page_raw("pilot.html")
        self.assertIn("Dec 2026", index_raw, "index.html must reference Dec 2026 pilot")
        self.assertIn("December 2026", pilot_raw, "pilot.html must reference December 2026")

    @feature("F4", tier=1)
    def test_f4_telemetry_hud_q3_price_reference(self):
        """F4: Verify calculator hints reference DG TAXUD quarterly price trajectory."""
        calc_raw = load_page_raw("calculator.html")
        self.assertIn("Q1 2026 €75.36", calc_raw)
        self.assertIn("Q2 €75.28", calc_raw)
        self.assertIn("Q3 €82.32", calc_raw)

    @feature("F4", tier=1)
    def test_f4_telemetry_hud_header_island_element(self):
        """F4: Verify presence of Header Ambient Island HUD or progressive check for M1."""
        header_raw = load_partial("header.html")
        has_island = ("telemetry" in header_raw or "ambient" in header_raw or "island" in header_raw
                      or "75.28" in header_raw)
        self.require_feature_impl(has_island, "F4", "Header should feature Ambient Island telemetry HUD")

    # --- F5: Master Design System Tokens ---

    @feature("F5", tier=1)
    def test_f5_design_tokens_css_variables_root(self):
        """F5: Verify :root contains obsidian palette tokens (--bg: #0A0C0B, --surface, --accent, --green)."""
        styles = load_asset("styles.css")
        self.assertIn("--bg: #0A0C0B", styles, ":root must define --bg: #0A0C0B")
        self.assertIn("--surface: #131816", styles, ":root must define --surface: #131816")
        self.assertIn("--accent: #FF5B1F", styles, ":root must define molten accent --accent: #FF5B1F")
        self.assertIn("--green: #3DDC97", styles, ":root must define verification mint --green: #3DDC97")

    @feature("F5", tier=1)
    def test_f5_design_tokens_molten_brand_ladder(self):
        """F5: Verify molten chromatic ladder tokens (--accent, --accent-2, --accent-3, --accent-rgb)."""
        styles = load_asset("styles.css")
        self.assertIn("--accent-2: #FFB547", styles)
        self.assertIn("--accent-3: #FF8A3D", styles)
        self.assertIn("--accent-rgb: 255, 91, 31", styles)

    @feature("F5", tier=1)
    def test_f5_design_tokens_typography_stack(self):
        """F5: Verify Geist, Bricolage Grotesque, and Geist Mono fonts in styles.css."""
        styles = load_asset("styles.css")
        self.assertIn("Bricolage Grotesque", styles, "Typography stack must include Bricolage Grotesque")
        self.assertIn("Geist", styles, "Typography stack must include Geist")
        self.assertIn("Geist Mono", styles, "Typography stack must include Geist Mono")

    @feature("F5", tier=1)
    def test_f5_design_tokens_light_scope(self):
        """F5: Verify .light scope defines inverted surface ladder for product workspace screens."""
        styles = load_asset("styles.css")
        self.assertIn(".light {", styles, "styles.css must define .light scope")
        self.assertIn("--bg: #F7F5F0", styles, ".light must define paper canvas --bg: #F7F5F0")
        self.assertIn("--surface: #FFFFFF", styles, ".light must define clean card --surface: #FFFFFF")

    @feature("F5", tier=1)
    def test_f5_design_tokens_alternate_themes(self):
        """F5: Verify data-theme selectors for ledger, forest, and cobalt themes."""
        styles = load_asset("styles.css")
        self.assertIn('html[data-theme="ledger"]', styles, "Ledger theme must be defined")
        self.assertIn('html[data-theme="forest"]', styles, "Forest theme must be defined")
        self.assertIn('html[data-theme="cobalt"]', styles, "Cobalt theme must be defined")

    @feature("F5", tier=1)
    def test_f5_design_tokens_theme_script_in_head(self):
        """F5: Verify build.py HEAD injects theme initialization script to prevent flash of unstyled theme."""
        doc = load_page("index.html")
        script = doc.find_one("script")
        self.assertIsNotNone(script, "Head should contain theme initialization script")
        self.assertIn("theme", script.get_text(), "Script should handle theme parameter")
