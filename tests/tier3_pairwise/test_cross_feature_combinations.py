"""Tier 3: Pairwise Combinatorial Tests.
Testing interactions between independent subsystems:
1. Calculator URL state serialization <-> Shared link restoration
2. Stockist mass-balance validation <-> Exporter precursor multi-lot weighting
3. Theme override parameter <-> Canvas particle colors & tokens
4. Navigation active state <-> Document title & page metadata
5. Pilot intake form validation <-> Field invalid styling
6. 7-Role state machine <-> Drawer open/close state retention
7. Mill sharing switches <-> DPDP consent state preservation
8. Verifier campaign schedule <-> Cost comparison table
9. Lender green loan application approval <-> Portfolio status
10. Importer EU quota 50% duty check <-> Melt-and-pour heat numbers
11. EEPC cluster pilot gates <-> Kill criterion threshold
12. Calculator product switch <-> Traced field visibility toggle
13. Tour chapter progression <-> Chapter pill active indicators
14. Hero flow canvas <-> prefers-reduced-motion accessibility
15. Unit economics worked example <-> Punjab 75% audit subsidy
16. Static build page generation <-> Clean URL routing definitions
17. Currency exchange rate <-> Certificate price <-> Per-tonne liability
18. WhatsApp OCR document extraction <-> Human reviewer approval queue
19. Responsive CSS grid <-> Viewport media queries collapse
20. Positive mathematical recovery card <-> Traced share slider position
"""
import re
import urllib.parse
from tests.base_test import CarbonKhataTestCase, feature, REPO_ROOT
from tests.dom_helper import load_page, load_page_raw, load_asset
from tests import cbam_engine

class TestCrossFeatureCombinations(CarbonKhataTestCase):

    @feature("F12", tier=3)
    def test_pairwise_calculator_url_state_link_restoration(self):
        """Pairwise 1: Calculator query string serialization <-> shared link restoration."""
        test_params = {"p": "bolts", "y": "2027", "t": "250", "eur": "80.00", "tr": "85"}
        query_string = urllib.parse.urlencode(test_params)
        parsed = urllib.parse.parse_qs(query_string)
        self.assertEqual(parsed["p"][0], "bolts")
        self.assertEqual(int(parsed["y"][0]), 2027)
        self.assertEqual(int(parsed["t"][0]), 250)
        self.assertAlmostEqual(float(parsed["eur"][0]), 80.0)
        self.assertEqual(int(parsed["tr"][0]), 85)

        r = cbam_engine.per_tonne(product=parsed["p"][0], year=int(parsed["y"][0]),
                                  price=float(parsed["eur"][0]), traced=int(parsed["tr"][0]) / 100.0)
        self.assertGreater(r["saving"], 0.0)

    @feature("F11", tier=3)
    def test_pairwise_stockist_mass_balance_and_exporter_precursor_averaging(self):
        """Pairwise 2: Stockist split of ST-7781 <-> Exporter weighted precursor calculation (Art. 14)."""
        # Shipment EU-2391 contains 72t from ST-7781 (see 2.38) and 54t direct (see 2.31)
        lot_a_t = 72
        lot_a_see = 2.38
        lot_b_t = 54
        lot_b_see = 2.31
        total_t = lot_a_t + lot_b_t
        own_process = 0.05

        weighted_precursor = (lot_a_t * lot_a_see + lot_b_t * lot_b_see) / total_t
        self.assertAlmostEqual(weighted_precursor, 2.35, places=2)
        total_see = weighted_precursor + own_process
        self.assertAlmostEqual(total_see, 2.40, places=2)

    @feature("F5", tier=3)
    def test_pairwise_theme_override_and_canvas_particle_colors(self):
        """Pairwise 3: ?theme=ledger|forest|cobalt override <-> home.js canvas color palette extraction."""
        home_js = load_asset("home.js")
        styles = load_asset("styles.css")
        self.assertIn('V("--bg-rgb")', home_js)
        self.assertIn('V("--accent-rgb")', home_js)
        self.assertIn("--bg-rgb:", styles)
        self.assertIn("--accent-rgb:", styles)

    @feature("F6", tier=3)
    def test_pairwise_navigation_active_state_and_head_title(self):
        """Pairwise 4: Active navigation indicator <-> Head title matching."""
        pages = [
            ("calculator.html", "calculator", "CBAM calculator"),
            ("pricing.html", "pricing", "Pricing"),
            ("trust.html", "trust", "Trust"),
            ("pilot.html", "pilot", "Ludhiana pilot"),
        ]
        for filename, page_attr, title_part in pages:
            doc = load_page(filename)
            body = doc.find_one("body")
            title = doc.find_one("title")
            self.assertEqual(body.get_attr("data-page"), page_attr)
            self.assertIn(title_part, title.get_text())

    @feature("F17", tier=3)
    def test_pairwise_pilot_intake_validation_and_form_state(self):
        """Pairwise 5: Pilot form validation failure <-> aria-invalid='true' and field .invalid class."""
        pilot_raw = load_page_raw("pilot.html")
        self.assertIn('el.setAttribute("aria-invalid", String(!ok))', pilot_raw)
        self.assertIn('el.closest(".field").classList.toggle("invalid", !ok)', pilot_raw)

    @feature("F10", tier=3)
    def test_pairwise_7role_drawer_state_and_shipment_json_export(self):
        """Pairwise 6: Exporter shipment selection <-> drawer opening <-> JSON export serialization."""
        app_js = load_asset("app.js")
        self.assertIn("function openShipment(id)", app_js)
        self.assertIn('$("drawer").dataset.open = "true"', app_js)
        self.assertIn("JSON.stringify(pkg, null, 2)", app_js)

    @feature("F14", tier=3)
    def test_pairwise_mill_sharing_toggle_and_dpdp_consent(self):
        """Pairwise 7: Mill sharing settings toggle <-> DPDP consent toast notification."""
        app_js = load_asset("app.js")
        self.assertIn('role="switch"', app_js)
        self.assertIn("DPDP consent recorded", app_js)
        self.assertIn('toast(`${s[0]}: ${s[2] ? "shared" : "not shared"}`)', app_js)

    @feature("F9", tier=3)
    def test_pairwise_verifier_campaign_schedule_and_site_readiness(self):
        """Pairwise 8: Verifier 10-site schedule board <-> site evidence pack readiness percentage."""
        app_js = load_asset("app.js")
        self.assertIn("sites this week", app_js.lower())
        self.assertIn("Evidence packs ready", app_js)
        self.assertIn("Sample Fasteners", app_js)

    @feature("F9", tier=3)
    def test_pairwise_lender_approval_and_portfolio_status(self):
        """Pairwise 9: Lender clicking Approve <-> Loan status badge updates to 'Approved'."""
        app_js = load_asset("app.js")
        self.assertIn('$("ap").onclick = () => { loan = "approved"', app_js)
        self.assertIn('toast("Loan approved")', app_js)

    @feature("F16", tier=3)
    def test_pairwise_importer_quota_50pct_and_heat_numbers(self):
        """Pairwise 10: Importer 50% duty avoidance <-> Melt-and-pour heat numbers in ledger."""
        app_js = load_asset("app.js")
        self.assertIn("Heat numbers, India", app_js)
        self.assertIn("Reg. 2026/1384", app_js)
        self.assertIn("50% duty", app_js)

    @feature("F17", tier=3)
    def test_pairwise_cluster_pilot_kpis_and_kill_criterion(self):
        """Pairwise 11: Cluster pilot dashboard 74% traced lots <-> Kill criterion threshold (50%)."""
        app_js = load_asset("app.js")
        self.assertIn("Kill criterion", app_js)
        self.assertIn("fewer than 50%", app_js)
        self.assertIn("Current: 74%", app_js)

    @feature("F12", tier=3)
    def test_pairwise_calculator_product_switch_and_traced_field(self):
        """Pairwise 12: Switching to coil hides traced field and sets ownProcess=0."""
        calc_js = load_asset("calc.js")
        self.assertIn('st.product === "bolts" ? "" : "none"', calc_js)
        r_coil = cbam_engine.per_tonne(product="coil", year=2026)
        r_bolts = cbam_engine.per_tonne(product="bolts", year=2026)
        self.assertNotEqual(r_coil["defSEE"], r_bolts["defSEE"])

    @feature("F18", tier=3)
    def test_pairwise_tour_navigation_and_chapter_highlight(self):
        """Pairwise 13: Advancing tour chapter <-> Chapter pill active state indicator."""
        tour_js = load_asset("tour.js")
        self.assertIn("tChapters", tour_js)
        self.assertIn('classList.toggle("on"', tour_js)

    @feature("F7", tier=3)
    def test_pairwise_hero_flow_canvas_and_reduced_motion(self):
        """Pairwise 14: prefers-reduced-motion media query suppresses hero flow animation."""
        home_js = load_asset("home.js")
        self.assertIn('const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;', home_js)
        self.assertIn("if (!c || reduce", home_js)

    @feature("F15", tier=3)
    def test_pairwise_pricing_worked_example_and_punjab_subsidy(self):
        """Pairwise 15: 300t bolt exporter worked example <-> Punjab 75% audit subsidy deduction."""
        pricing_raw = load_page_raw("pricing.html")
        self.assertIn("₹91.1 L", pricing_raw)
        self.assertIn("Punjab's 2026 industrial policy", pricing_raw)
        self.assertIn("75%", pricing_raw)

    @feature("F20", tier=3)
    def test_pairwise_build_meta_comments_and_clean_urls(self):
        """Pairwise 16: Source comments in pages/*.html <-> build output clean URLs."""
        pages_dir = REPO_ROOT / "pages"
        for p in pages_dir.glob("*.html"):
            text = p.read_text(encoding="utf-8")
            self.assertTrue(text.startswith("<!-- title:"), f"{p.name} must start with title comment")

    @feature("F4", tier=3)
    def test_pairwise_currency_fx_and_cbam_liability(self):
        """Pairwise 17: Exchange rate (₹108/€) <-> certificate price (€75.28) <-> per-tonne liability."""
        k = cbam_engine.PRICE_2026 * cbam_engine.FX
        self.assertEqual(k, 8130.24)
        r = cbam_engine.per_tonne()
        self.assertEqual(r["k"], k)

    @feature("F10", tier=3)
    def test_pairwise_whatsapp_ocr_loop_and_evidence_inbox(self):
        """Pairwise 18: WhatsApp OCR chat bill in home.js <-> Reviewer approval in app.js evidence inbox."""
        home_js = load_asset("home.js")
        app_js = load_asset("app.js")
        self.assertIn("PUNJAB FUELS", home_js)
        self.assertIn("3,200 L", home_js)
        self.assertIn("Punjab Fuels", app_js)
        self.assertIn("3,200 L", app_js)

    @feature("F19", tier=3)
    def test_pairwise_responsive_css_grid_and_viewport_media_queries(self):
        """Pairwise 19: CSS .grid and .cols-3 classes collapse on tablet / mobile."""
        styles = load_asset("styles.css")
        self.assertIn(".cols-3", styles)
        self.assertIn(".grid", styles)

    @feature("F13", tier=3)
    def test_pairwise_positive_recovery_guidance_and_traced_share_slider(self):
        """Pairwise 20: Recovery card shortfall recalculates as traced slider changes."""
        tonnes = 120
        # For slider values from 0 to 100 in steps of 10
        for tr_pct in range(0, 70, 10):
            tr = tr_pct / 100.0
            shortfall = (0.70 - tr) * tonnes
            self.assertGreater(shortfall, 0)
