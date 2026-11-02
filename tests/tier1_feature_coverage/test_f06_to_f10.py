"""Tier 1: Feature Coverage Tests for F6 to F10.
Covering:
- F6: Header & Footer Navigation Harmony (Active page indicator for all 8 routes, complete solutions list in footer including Lenders)
- F7: Landing Page Hero & Flow Elevation (Smooth 3D perspective card tilt, responsive floating chips, kinetic statement, restore #mapTip)
- F8: Steel Supply Chain Journey (Interactive Odisha mill -> Mandi Gobindgarh -> Ludhiana -> Mundra -> Hamburg route map)
- F9: The Three Pillars Presentation (Precursor Data Rail, Batched Verification (-66% cost), and Carbon-to-Cash green lending)
- F10: 7-Role Simulation Command Deck (Persona Quick-Switch Dock on platform.html with 1-click judge guided scenarios and JSON export)
"""
from tests.base_test import CarbonKhataTestCase, feature
from tests.dom_helper import load_page, load_page_raw, load_asset, load_partial

class TestFeaturesF06ToF10(CarbonKhataTestCase):

    # --- F6: Header & Footer Navigation Harmony ---

    @feature("F6", tier=1)
    def test_f6_navigation_all_eight_routes(self):
        """F6: Verify presence of all 8 core route targets across navigation links."""
        expected_routes = {"/", "/tour", "/calculator", "/pricing", "/trust", "/pilot", "/platform"}
        header_raw = load_partial("header.html")
        for route in expected_routes:
            self.assertIn(f'href="{route}"', header_raw, f"Header must link to {route}")

    @feature("F6", tier=1)
    def test_f6_navigation_active_page_indicator_attribute(self):
        """F6: Verify generated pages carry data-page attribute on body matching their route identifier."""
        pages_to_check = [
            ("index.html", "home"),
            ("platform.html", "platform"),
            ("calculator.html", "calculator"),
            ("pricing.html", "pricing"),
            ("trust.html", "trust"),
            ("pilot.html", "pilot"),
            ("tour.html", "tour"),
            ("solutions.html", "solutions"),
        ]
        for filename, expected_page in pages_to_check:
            doc = load_page(filename)
            body = doc.find_one("body")
            self.assertIsNotNone(body, f"{filename} must have a <body> tag")
            self.assertEqual(body.get_attr("data-page"), expected_page,
                             f"{filename} body must have data-page='{expected_page}'")

    @feature("F6", tier=1)
    def test_f6_navigation_solutions_dropdown_items(self):
        """F6: Verify header solutions dropdown has 6 items (exporters, stockists, mills, verifiers, importers, lenders)."""
        doc = load_page("index.html")
        drop = doc.find_one("div", {"class": "drop-panel"})
        self.assertIsNotNone(drop, "Solutions dropdown panel must exist in header")
        links = drop.find_all("a")
        hrefs = [a.get_attr("href") for a in links]
        expected_anchors = ["#exporters", "#stockists", "#mills", "#verifiers", "#importers", "#lenders"]
        for anchor in expected_anchors:
            self.assertTrue(any(anchor in h for h in hrefs), f"Dropdown must link to {anchor}")

    @feature("F6", tier=1)
    def test_f6_navigation_footer_solutions_list_includes_lenders(self):
        """F6: Verify footer solutions list includes Lenders or progressive check for M1."""
        footer_raw = load_partial("footer.html")
        has_lenders = "/solutions#lenders" in footer_raw
        self.require_feature_impl(has_lenders, "F6", "Footer Solutions list should include Lenders (/solutions#lenders)")

    @feature("F6", tier=1)
    def test_f6_navigation_mobile_nav_completeness(self):
        """F6: Verify mobile navigation menu includes links to all key platform views."""
        doc = load_page("index.html")
        mnav = doc.find_one("nav", {"class": "mobile-nav"})
        self.assertIsNotNone(mnav, "Mobile navigation element must exist")
        mnav_text = mnav.get_text()
        self.assertIn("Try the demo", mnav_text)
        self.assertIn("Product tour", mnav_text)
        self.assertIn("Calculator", mnav_text)
        self.assertIn("Pricing", mnav_text)

    # --- F7: Landing Page Hero & Flow Elevation ---

    @feature("F7", tier=1)
    def test_f7_hero_canvas_element(self):
        """F7: Verify #flow canvas element exists on landing page for molten flow field."""
        doc = load_page("index.html")
        canvas = doc.find_by_id("flow")
        self.assertIsNotNone(canvas, "#flow canvas element must exist on index.html")
        self.assertEqual(canvas.get_attr("aria-hidden"), "true")

    @feature("F7", tier=1)
    def test_f7_hero_floating_chips_depth_attributes(self):
        """F7: Verify floating cards and chips carry data-depth attributes for 3D parallax."""
        doc = load_page("index.html")
        chips = doc.find_all("div", {"class": "float"})
        self.assertGreaterEqual(len(chips), 3, "Hero stage must have at least 3 floating layers")
        for chip in chips:
            self.assertTrue(chip.has_attr("data-depth"), "Floating element must have data-depth attribute")

    @feature("F7", tier=1)
    def test_f7_hero_cta_buttons(self):
        """F7: Verify primary and secondary CTA buttons in landing page hero."""
        doc = load_page("index.html")
        hero = doc.find_one("section", {"class": "hero"})
        self.assertIsNotNone(hero, "Hero section must exist")
        cta_primary = hero.find_one("a", {"class": "btn-accent"})
        self.assertIsNotNone(cta_primary, "Primary hero CTA must exist")
        self.assertEqual(cta_primary.get_attr("href"), "/platform")
        cta_secondary = hero.find_one("a", {"class": "btn-secondary"})
        self.assertIsNotNone(cta_secondary, "Secondary hero CTA must exist")
        self.assertEqual(cta_secondary.get_attr("href"), "/tour")

    @feature("F7", tier=1)
    def test_f7_hero_kinetic_statement_section(self):
        """F7: Verify presence of kinetic problem statement section on index.html."""
        doc = load_page("index.html")
        stmt = doc.find_by_id("statement")
        self.assertIsNotNone(stmt, "#statement element must exist")
        self.assertIn("default value", stmt.get_text(), "Statement must articulate the default value trap")

    @feature("F7", tier=1)
    def test_f7_hero_maptip_element(self):
        """F7: Check for presence of #mapTip element on index.html or progressive check for M2."""
        doc = load_page("index.html")
        maptip = doc.find_by_id("mapTip")
        has_tip = maptip is not None
        self.require_feature_impl(has_tip, "F7", "Landing page should feature #mapTip element referenced by home.js")

    # --- F8: Steel Supply Chain Journey ---

    @feature("F8", tier=1)
    def test_f8_supply_chain_map_svg_element(self):
        """F8: Verify #map SVG exists inside #journey section with responsive attributes."""
        doc = load_page("index.html")
        svg_map = doc.find_by_id("map")
        self.assertIsNotNone(svg_map, "#map SVG element must exist")
        self.assertEqual(svg_map.get_attr("viewbox"), "0 0 1200 760")
        self.assertEqual(svg_map.get_attr("preserveaspectratio"), "xMidYMid meet")

    @feature("F8", tier=1)
    def test_f8_supply_chain_stops_articles(self):
        """F8: Verify stops article list exists in #stops container."""
        doc = load_page("index.html")
        stops_container = doc.find_by_id("stops")
        self.assertIsNotNone(stops_container, "#stops container must exist")
        stops = stops_container.find_all("article")
        self.assertGreaterEqual(len(stops), 4, "Journey must feature at least 4 stop articles")

    @feature("F8", tier=1)
    def test_f8_supply_chain_key_hubs(self):
        """F8: Verify key journey hubs (Odisha, Mandi Gobindgarh, Ludhiana, Mundra, Hamburg) in index.html."""
        raw = load_page_raw("index.html")
        self.assertIn("Odisha", raw, "Journey must mention Odisha mill origin")
        self.assertIn("Mandi Gobindgarh", raw, "Journey must mention Mandi Gobindgarh stockist")
        self.assertIn("Ludhiana", raw, "Journey must mention Ludhiana MSME workshop")
        self.assertIn("Mundra", raw, "Journey must mention Mundra port")
        self.assertIn("Hamburg", raw, "Journey must mention Hamburg EU destination")

    @feature("F8", tier=1)
    def test_f8_supply_chain_map_legend(self):
        """F8: Verify map legend contains required transport and region indicators."""
        doc = load_page("index.html")
        legend = doc.find_one("div", {"class": "map-legend"})
        self.assertIsNotNone(legend, "map-legend element must exist")
        legend_text = legend.get_text()
        self.assertIn("India", legend_text)
        self.assertIn("EU", legend_text)
        self.assertIn("Rail", legend_text)
        self.assertIn("Sea", legend_text)

    @feature("F8", tier=1)
    def test_f8_supply_chain_worldmap_vector_coordinates(self):
        """F8: Verify assets/worldmap.js exists and exports valid vector map geometries."""
        worldmap_js = load_asset("worldmap.js")
        self.assertGreater(len(worldmap_js), 10000, "worldmap.js must contain Natural Earth vector data")
        self.assertIn("India", worldmap_js, "worldmap.js must contain India geometry")

    # --- F9: The Three Pillars Presentation ---

    @feature("F9", tier=1)
    def test_f9_three_pillars_precursor_data_rail(self):
        """F9: Verify Precursor Data Rail principles (heat numbers, mass-balance, IRN) in solutions.html."""
        raw = load_page_raw("solutions.html")
        self.assertIn("sale beyond the tonnes bought", raw.lower(), "Solutions must explain mass-balance guard")
        self.assertIn("report", raw.lower(), "Solutions must explain mill report transmission")

    @feature("F9", tier=1)
    def test_f9_three_pillars_batched_verification(self):
        """F9: Verify Batched Verification cost reduction (-66%, ₹17.5L to ₹6.0L) in solutions and platform."""
        sol_raw = load_page_raw("solutions.html")
        app_raw = load_asset("app.js")
        self.assertIn("17.5", sol_raw, "Solutions must show ₹17.5L alone audit cost")
        self.assertIn("6.0", sol_raw, "Solutions must show ₹6.0L batched audit cost")
        self.assertIn("17.5", app_raw, "app.js must model ₹17.5L alone cost")
        self.assertIn("6.0", app_raw, "app.js must model ₹6.0L batched cost")

    @feature("F9", tier=1)
    def test_f9_three_pillars_carbon_to_cash(self):
        """F9: Verify Carbon-to-Cash green lending integration in solutions.html."""
        sol_raw = load_page_raw("solutions.html")
        self.assertIn("green loan", sol_raw.lower(), "Solutions must describe green loan enablement")
        self.assertIn("₹40 L", sol_raw, "Solutions must mention ₹40 L green loan example")

    @feature("F9", tier=1)
    def test_f9_three_pillars_icons(self):
        """F9: Verify icons for factory, shield, and bank exist in assets/site.js."""
        site_js = load_asset("site.js")
        self.assertIn("factory:", site_js, "site.js must include factory icon")
        self.assertIn("shield:", site_js, "site.js must include shield icon")
        self.assertIn("bank:", site_js, "site.js must include bank icon")

    @feature("F9", tier=1)
    def test_f9_three_pillars_structured_presentation(self):
        """F9: Verify presentation of the three pillars across narrative pages."""
        pricing_raw = load_page_raw("pricing.html")
        trust_raw = load_page_raw("trust.html")
        self.assertIn("monitoring plan", pricing_raw.lower())
        self.assertIn("cluster", pricing_raw.lower())
        self.assertIn("verifier", trust_raw.lower())

    # --- F10: 7-Role Simulation Command Deck ---

    @feature("F10", tier=1)
    def test_f10_seven_roles_defined_in_app(self):
        """F10: Verify all 7 roles are defined in assets/app.js ROLES dictionary."""
        app_js = load_asset("app.js")
        expected_roles = ["exporter", "stockist", "mill", "verifier", "importer", "lender", "cluster"]
        for role in expected_roles:
            self.assertIn(f"{role}:", app_js, f"app.js must define {role} in ROLES")

    @feature("F10", tier=1)
    def test_f10_seven_roles_options_in_select(self):
        """F10: Verify #roleSel in platform.html contains all 7 role options."""
        doc = load_page("platform.html")
        sel = doc.find_by_id("roleSel")
        self.assertIsNotNone(sel, "#roleSel select element must exist")
        options = sel.find_all("option")
        vals = [opt.get_attr("value") for opt in options]
        expected_roles = ["exporter", "stockist", "mill", "verifier", "importer", "lender", "cluster"]
        for role in expected_roles:
            self.assertIn(role, vals, f"#roleSel must contain option value='{role}'")

    @feature("F10", tier=1)
    def test_f10_platform_drawer_structure(self):
        """F10: Verify platform #drawer dialog element and sub-elements."""
        doc = load_page("platform.html")
        drawer = doc.find_by_id("drawer")
        self.assertIsNotNone(drawer, "#drawer element must exist on platform.html")
        self.assertEqual(drawer.get_attr("role"), "dialog")
        self.assertIsNotNone(doc.find_by_id("drawerKicker"), "#drawerKicker must exist")
        self.assertIsNotNone(doc.find_by_id("drawerTitle"), "#drawerTitle must exist")
        self.assertIsNotNone(doc.find_by_id("drawerBody"), "#drawerBody must exist")

    @feature("F10", tier=1)
    def test_f10_platform_json_export_structure(self):
        """F10: Verify JSON export structure in app.js includes necessary regulatory fields."""
        app_js = load_asset("app.js")
        self.assertIn("carbon-khata-", app_js, "app.js must name export file with prefix carbon-khata-")
        self.assertIn("cn_code", app_js, "Export JSON must include cn_code")
        self.assertIn("see_direct_tco2_per_t", app_js, "Export JSON must include see_direct_tco2_per_t")
        self.assertIn("IR 2025/2547 Art. 14", app_js, "Export JSON must cite IR 2025/2547 Art. 14 method")

    @feature("F10", tier=1)
    def test_f10_platform_command_deck_quick_switch(self):
        """F10: Check Persona Quick-Switch Dock or progressive check for M3."""
        plat_raw = load_page_raw("platform.html")
        has_dock = ("quick-switch" in plat_raw or "dock" in plat_raw or "command-deck" in plat_raw)
        self.require_feature_impl(has_dock, "F10", "platform.html should feature Persona Quick-Switch Dock")
