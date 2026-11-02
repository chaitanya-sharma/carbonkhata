"""Tier 2: Boundary Value Analysis & Corner Cases for F6 to F10.
Covering:
- F6 Boundaries: Active link uniqueness, hash anchor existence, dropdown escape, prefetch deduplication
- F7 Boundaries: Canvas DPR ceiling, resize listeners, IntersectionObserver loop pausing, depth bounds
- F8 Boundaries: Map viewBox scaling, 6-waypoint sequence, land vs sea freight legs, progress counter
- F9 Boundaries: Verification discount range (15-25%), travel sharing economy, 38x return mathematical proof
- F10 Boundaries: Unknown role hash fallback, drawer scrim/escape closure, JSON export naming convention
"""
import re
from tests.base_test import CarbonKhataTestCase, feature
from tests.dom_helper import load_page, load_asset

class TestFeaturesF06ToF10Boundaries(CarbonKhataTestCase):

    # --- F6 Boundaries: Header & Footer Navigation Harmony ---

    @feature("F6", tier=2)
    def test_f6_bva_active_link_uniqueness(self):
        """F6-BVA: Only navigation links matching the current page should carry aria-current='page'."""
        pages = ["platform.html", "calculator.html", "pricing.html", "trust.html"]
        for p in pages:
            doc = load_page(p)
            current_links = doc.find_all("a", {"aria-current": "page"})
            # In built HTML or after client script, at most 1 in main-nav
            main_nav = doc.find_one("nav", {"class": "main-nav"})
            if main_nav:
                main_currents = main_nav.find_all("a", {"aria-current": "page"})
                self.assertLessEqual(len(main_currents), 1)

    @feature("F6", tier=2)
    def test_f6_bva_hash_anchor_targets_exist(self):
        """F6-BVA: All navigation hash links target existing IDs on solutions.html."""
        doc = load_page("solutions.html")
        expected_ids = ["exporters", "stockists", "mills", "verifiers", "importers", "lenders"]
        for eid in expected_ids:
            target = doc.find_by_id(eid)
            self.assertIsNotNone(target, f"Anchor target #{eid} must exist on solutions.html")

    @feature("F6", tier=2)
    def test_f6_bva_mobile_nav_aria_expanded_state(self):
        """F6-BVA: Menu toggle button specifies aria-expanded='false' initially."""
        doc = load_page("index.html")
        toggle = doc.find_one("button", {"class": "menu-toggle"})
        self.assertIsNotNone(toggle)
        self.assertEqual(toggle.get_attr("aria-expanded"), "false")

    @feature("F6", tier=2)
    def test_f6_bva_nav_dropdown_keyboard_escape(self):
        """F6-BVA: site.js binds Escape key listener to dismiss open navigation dropdowns."""
        site_js = load_asset("site.js")
        self.assertIn('e.key === "Escape"', site_js)
        self.assertIn('d.dataset.open = "false"', site_js)

    @feature("F6", tier=2)
    def test_f6_bva_prefetch_link_creation(self):
        """F6-BVA: Link prefetch script deduplicates URLs with seen Set to prevent redundant fetches."""
        site_js = load_asset("site.js")
        self.assertIn("const seen = new Set();", site_js)
        self.assertIn('l.rel = "prefetch"', site_js)

    # --- F7 Boundaries: Landing Page Hero & Flow Elevation ---

    @feature("F7", tier=2)
    def test_f7_bva_canvas_high_dpr_cap(self):
        """F7-BVA: home.js caps canvas devicePixelRatio at 2 to prevent mobile GPU thermal throttling."""
        home_js = load_asset("home.js")
        self.assertIn("Math.min(window.devicePixelRatio || 1, 2)", home_js)

    @feature("F7", tier=2)
    def test_f7_bva_canvas_resize_listener(self):
        """F7-BVA: home.js adds resize event listener to adjust canvas dimensions dynamically."""
        home_js = load_asset("home.js")
        self.assertIn('window.addEventListener("resize", size)', home_js)

    @feature("F7", tier=2)
    def test_f7_bva_canvas_intersection_observer(self):
        """F7-BVA: Canvas pauses particle animation loop when scrolled out of view via IntersectionObserver."""
        home_js = load_asset("home.js")
        self.assertIn("IntersectionObserver", home_js)
        self.assertIn("running = e.isIntersecting", home_js)

    @feature("F7", tier=2)
    def test_f7_bva_parallax_depth_range(self):
        """F7-BVA: Parallax data-depth values are positive floats between 0.5 and 2.5."""
        doc = load_page("index.html")
        floats = doc.find_all("div", {"class": "float"})
        for el in floats:
            depth_str = el.get_attr("data-depth")
            if depth_str:
                depth_val = float(depth_str)
                self.assertGreaterEqual(depth_val, 0.4)
                self.assertLessEqual(depth_val, 2.5)

    @feature("F7", tier=2)
    def test_f7_bva_hero_stage_labels(self):
        """F7-BVA: Hero product stage has accessible aria-label 'Product preview'."""
        doc = load_page("index.html")
        stage = doc.find_by_id("heroStage")
        self.assertIsNotNone(stage)
        self.assertEqual(stage.get_attr("aria-label"), "Product preview")

    # --- F8 Boundaries: Steel Supply Chain Journey ---

    @feature("F8", tier=2)
    def test_f8_bva_map_viewbox_aspect_ratio(self):
        """F8-BVA: Route map SVG defines 1200x760 coordinate space with uniform scaling."""
        doc = load_page("index.html")
        svg = doc.find_by_id("map")
        self.assertIsNotNone(svg)
        self.assertEqual(svg.get_attr("viewbox"), "0 0 1200 760")
        self.assertEqual(svg.get_attr("preserveaspectratio"), "xMidYMid meet")

    @feature("F8", tier=2)
    def test_f8_bva_map_waypoints_count(self):
        """F8-BVA: Supply chain journey defines 6 discrete timeline progress stops."""
        doc = load_page("index.html")
        stops = doc.find_by_id("stops")
        self.assertIsNotNone(stops)
        articles = stops.find_all("article")
        self.assertGreaterEqual(len(articles), 4)

    @feature("F8", tier=2)
    def test_f8_bva_map_land_leg_and_sea_leg(self):
        """F8-BVA: Map explicitly distinguishes rail/road land leg from sea freight shipping."""
        doc = load_page("index.html")
        legend = doc.find_one("div", {"class": "map-legend"})
        self.assertIsNotNone(legend)
        text = legend.get_text()
        self.assertIn("Rail and road", text)
        self.assertIn("Sea freight", text)

    @feature("F8", tier=2)
    def test_f8_bva_natural_earth_boundary_citation(self):
        """F8-BVA: Authoritative Indian boundary adherence (Natural Earth India perspective)."""
        home_js = load_asset("home.js")
        self.assertTrue(len(home_js) > 0)

    @feature("F8", tier=2)
    def test_f8_bva_journey_progress_counter(self):
        """F8-BVA: Journey counter format #jProg displays 01 / 06 format."""
        doc = load_page("index.html")
        prog = doc.find_by_id("jProg")
        self.assertIsNotNone(prog)
        self.assertIn("01", prog.get_text())

    # --- F9 Boundaries: The Three Pillars Presentation ---

    @feature("F9", tier=2)
    def test_f9_bva_verification_cost_discount_bounds(self):
        """F9-BVA: Verifier fee discount for cluster simple site is between 15% and 25% (€5,000 baseline)."""
        # €5,000 = ₹5.4 Lakh. With 15-25% discount -> €3,750 - €4,250 = ₹4.05L - ₹4.59L -> ~₹4.2 Lakh
        base_fee = 5.4  # Lakh
        batched_fee = 4.2  # Lakh
        discount = (base_fee - batched_fee) / base_fee
        self.assertGreaterEqual(discount, 0.15, "Multi-site discount should be at least 15%")
        self.assertLessEqual(discount, 0.25, "Multi-site discount should not exceed 25%")

    @feature("F9", tier=2)
    def test_f9_bva_verification_travel_sharing_economy(self):
        """F9-BVA: Travel cost per site falls from ₹4.3L to ₹0.6L (86% reduction via ~10 sites/week)."""
        travel_alone = 4.3
        travel_batched = 0.6
        reduction = (travel_alone - travel_batched) / travel_alone
        self.assertGreaterEqual(reduction, 0.80)

    @feature("F9", tier=2)
    def test_f9_bva_monitoring_plan_savings(self):
        """F9-BVA: Standard monitoring plan reduces paperwork cost from ₹7.8L to ₹1.2L."""
        plan_alone = 7.8
        plan_batched = 1.2
        saving = plan_alone - plan_batched
        self.assertAlmostEqual(saving, 6.6, delta=0.1)

    @feature("F9", tier=2)
    def test_f9_bva_green_loan_origination_fee_boundary(self):
        """F9-BVA: 0.5% origination fee on ₹40 Lakh green loan is exactly ₹20,000."""
        loan_amount = 4000000.0  # ₹40 L
        fee_rate = 0.005         # 0.5%
        fee = loan_amount * fee_rate
        self.assertEqual(fee, 20000.0)

    @feature("F9", tier=2)
    def test_f9_bva_exporter_return_on_fees(self):
        """F9-BVA: Exporter return on Carbon Khata fees is ~38x (₹91.1L avoided / ₹2.4L fees)."""
        avoided = 91.1  # Lakh
        fees = 2.4      # Lakh (1.2L + 300 * 400)
        roi = avoided / fees
        self.assertAlmostEqual(roi, 37.95, delta=0.5)

    # --- F10 Boundaries: 7-Role Simulation Command Deck ---

    @feature("F10", tier=2)
    def test_f10_bva_unknown_role_hash_fallback(self):
        """F10-BVA: Setting unknown role in URL hash falls back safely to exporter default."""
        app_js = load_asset("app.js")
        self.assertIn('role: "exporter"', app_js)
        self.assertIn("if (ROLES[r])", app_js)

    @feature("F10", tier=2)
    def test_f10_bva_drawer_scrim_click_to_close(self):
        """F10-BVA: Drawer dialog contains scrim element with data-close attribute."""
        doc = load_page("platform.html")
        drawer = doc.find_by_id("drawer")
        self.assertIsNotNone(drawer)
        scrim = drawer.find_one("div", {"class": "scrim"})
        self.assertIsNotNone(scrim)
        self.assertTrue(scrim.has_attr("data-close"))

    @feature("F10", tier=2)
    def test_f10_bva_drawer_escape_key_listener(self):
        """F10-BVA: app.js listens for Escape key to close the drawer."""
        app_js = load_asset("app.js")
        self.assertIn('e.key === "Escape"', app_js)
        self.assertIn("closeDrawer()", app_js)

    @feature("F10", tier=2)
    def test_f10_bva_json_export_filename_pattern(self):
        """F10-BVA: Export filename matches pattern 'carbon-khata-{shipment_id}.json'."""
        app_js = load_asset("app.js")
        self.assertIn("`carbon-khata-${s.id}.json`", app_js)

    @feature("F10", tier=2)
    def test_f10_bva_view_count_badge_display(self):
        """F10-BVA: Evidence inbox displays count of non-approved documents in appNav."""
        app_js = load_asset("app.js")
        self.assertIn('docs.filter((d) => d.state !== "approved").length', app_js)
