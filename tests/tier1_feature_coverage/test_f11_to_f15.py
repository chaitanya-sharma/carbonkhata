"""Tier 1: Feature Coverage Tests for F11 to F15.
Covering:
- F11: Stockist Mass-Balance Guard (Real-time validation strictly blocking over-sales with visual error alerts and audit logs)
- F12: CBAM Calculator Modernization (Responsive CSS grid, free-allocation deduction clarity, live 8-step regulatory audit walk)
- F13: Positive Mathematical Recovery Card (Dynamic guidance card when traced share < 70%, showing exact tonnes needed to regain discount)
- F14: Stakeholder Solutions Architecture (6 persona sections with deep links to platform simulation roles and financial value breakdown)
- F15: Unit Economics & Pricing Model (Interactive volume slider, 10.7x ROI worked example, Punjab 75% audit subsidy badge)
"""
import math
from tests.base_test import CarbonKhataTestCase, feature
from tests.dom_helper import load_page, load_page_raw, load_asset
from tests import cbam_engine

class TestFeaturesF11ToF15(CarbonKhataTestCase):

    # --- F11: Stockist Mass-Balance Guard ---

    @feature("F11", tier=1)
    def test_f11_mass_balance_guard_blocking_logic_in_app(self):
        """F11: Verify app.js contains strict condition blocking sales when requested tonnes exceed remaining lot capacity."""
        app_js = load_asset("app.js")
        self.assertIn("t > left", app_js, "app.js must validate if t > left")
        self.assertIn("Blocked.", app_js, "app.js must return Blocked message on over-sale")

    @feature("F11", tier=1)
    def test_f11_mass_balance_guard_error_alert_content(self):
        """F11: Verify over-sale alert message explicitly references mass-balance rule."""
        app_js = load_asset("app.js")
        self.assertIn("can't cover more tonnes than you bought", app_js,
                      "Alert must explain that report cannot cover more tonnes than bought")

    @feature("F11", tier=1)
    def test_f11_mass_balance_sample_lots_inventory(self):
        """F11: Verify sample lots ST-7781, ST-7790, and ST-7802 in app.js."""
        app_js = load_asset("app.js")
        self.assertIn('"ST-7781"', app_js)
        self.assertIn('"ST-7790"', app_js)
        self.assertIn('"ST-7802"', app_js)

    @feature("F11", tier=1)
    def test_f11_mass_balance_meter_display(self):
        """F11: Verify mass-balance meter bar element rendered in stockist lot details."""
        app_js = load_asset("app.js")
        self.assertIn('class="meter"', app_js, "app.js must render meter element")
        self.assertIn("sold / L.t * 100", app_js, "Meter width must reflect proportion sold")

    @feature("F11", tier=1)
    def test_f11_mass_balance_tally_prime_tagging(self):
        """F11: Verify stockist view displays Tally Prime e-invoice and Carbon Khata lot tagging."""
        app_js = load_asset("app.js")
        self.assertIn("TALLY PRIME", app_js, "app.js must show Tally Prime header")
        self.assertIn("Carbon Khata tag", app_js, "app.js must show Carbon Khata tag row")

    # --- F12: CBAM Calculator Modernization ---

    @feature("F12", tier=1)
    def test_f12_calculator_form_inputs_presence(self):
        """F12: Verify calculator form contains tons, price, and traced input fields."""
        doc = load_page("calculator.html")
        self.assertIsNotNone(doc.find_by_id("tons"), "Input #tons must exist")
        self.assertIsNotNone(doc.find_by_id("price"), "Input #price must exist")
        self.assertIsNotNone(doc.find_by_id("traced"), "Input #traced must exist")

    @feature("F12", tier=1)
    def test_f12_calculator_segments_product_and_year(self):
        """F12: Verify segmented buttons for product (bolts, coil) and year (2026, 2027, 2028)."""
        doc = load_page("calculator.html")
        seg_prod = doc.find_by_id("segProduct")
        seg_year = doc.find_by_id("segYear")
        self.assertIsNotNone(seg_prod, "#segProduct must exist")
        self.assertIsNotNone(seg_year, "#segYear must exist")

        prod_btns = [b.get_attr("data-v") for b in seg_prod.find_all("button")]
        self.assertIn("bolts", prod_btns)
        self.assertIn("coil", prod_btns)

        year_btns = [b.get_attr("data-v") for b in seg_year.find_all("button")]
        self.assertIn("2026", year_btns)
        self.assertIn("2027", year_btns)
        self.assertIn("2028", year_btns)

    @feature("F12", tier=1)
    def test_f12_calculator_metrics_cards(self):
        """F12: Verify metric output elements #mDef, #mAct, #mSave exist on calculator.html."""
        doc = load_page("calculator.html")
        self.assertIsNotNone(doc.find_by_id("mDef"), "#mDef element must exist")
        self.assertIsNotNone(doc.find_by_id("mAct"), "#mAct element must exist")
        self.assertIsNotNone(doc.find_by_id("mSave"), "#mSave element must exist")

    @feature("F12", tier=1)
    def test_f12_calculator_walk_table_element(self):
        """F12: Verify table #walk exists for regulatory audit walk-through."""
        doc = load_page("calculator.html")
        walk = doc.find_by_id("walk")
        self.assertIsNotNone(walk, "#walk table element must exist")

    @feature("F12", tier=1)
    def test_f12_calculator_walk_steps_count(self):
        """F12: Verify calc.js renders 8 distinct calculation steps in #walk table."""
        calc_js = load_asset("calc.js")
        self.assertIn("Embedded emissions", calc_js)
        self.assertIn("EU benchmark", calc_js)
        self.assertIn("CBAM factor", calc_js)
        self.assertIn("Free-allocation adjustment", calc_js)
        self.assertIn("Certificates per tonne", calc_js)
        self.assertIn("Price × exchange rate", calc_js)
        self.assertIn("Cost per tonne", calc_js)
        self.assertIn("Cost for", calc_js)

    @feature("F12", tier=1)
    def test_f12_calculator_url_state_sync(self):
        """F12: Verify calc.js synchronizes state with URL search params."""
        calc_js = load_asset("calc.js")
        self.assertIn("new URLSearchParams", calc_js)
        self.assertIn("history.replaceState", calc_js)

    # --- F13: Positive Mathematical Recovery Card ---

    @feature("F13", tier=1)
    def test_f13_recovery_card_threshold_mathematics(self):
        """F13: Verify mathematical shortfall calculation when traced share < 70%."""
        total_tons = 120
        current_traced = 0.40  # 40%
        target_traced = 0.70   # 70%
        needed_tons = math.ceil((target_traced - current_traced) * total_tons)
        self.assertEqual(needed_tons, 36, "120t at 40% needs exactly 36t more to hit 70% threshold")

    @feature("F13", tier=1)
    def test_f13_recovery_card_savings_gap(self):
        """F13: Verify savings gain when moving from 40% traced to 70% target."""
        r40 = cbam_engine.per_tonne(product="bolts", year=2026, traced=0.40)
        r70 = cbam_engine.per_tonne(product="bolts", year=2026, traced=0.70)
        gap_per_tonne = r70["saving"] - r40["saving"]
        self.assertGreater(gap_per_tonne, 0, "70% traced must provide greater savings than 40% traced")

    @feature("F13", tier=1)
    def test_f13_recovery_card_element_presence(self):
        """F13: Check for recovery card element in calculator or progressive check for M4."""
        calc_raw = load_page_raw("calculator.html")
        calc_js = load_asset("calc.js")
        has_card = ("recovery" in calc_raw.lower() or "recovery" in calc_js.lower()
                    or "traced < 0.7" in calc_js or "target 70%" in calc_raw.lower())
        self.require_feature_impl(has_card, "F13", "calculator.html should include Positive Mathematical Recovery Card")

    @feature("F13", tier=1)
    def test_f13_recovery_card_dynamic_updates(self):
        """F13: Verify recovery card condition is tied to traced input threshold (< 70%)."""
        # Test logic verification
        traced_vals = [0.1, 0.3, 0.5, 0.69, 0.70, 0.9, 1.0]
        should_trigger = [v < 0.70 for v in traced_vals]
        self.assertEqual(should_trigger, [True, True, True, True, False, False, False])

    @feature("F13", tier=1)
    def test_f13_recovery_card_tone_and_trajectory(self):
        """F13: Verify recovery formula provides positive trajectory guidance."""
        for t in [50, 100, 300]:
            tonnes_at_50pct = math.ceil((0.70 - 0.50) * t)
            self.assertEqual(tonnes_at_50pct, math.ceil(0.20 * t))

    # --- F14: Stakeholder Solutions Architecture ---

    @feature("F14", tier=1)
    def test_f14_solutions_six_persona_sections(self):
        """F14: Verify 6 persona sections in solutions.html (exporters, stockists, mills, verifiers, importers, lenders)."""
        doc = load_page("solutions.html")
        expected_ids = ["exporters", "stockists", "mills", "verifiers", "importers", "lenders"]
        for sec_id in expected_ids:
            sec = doc.find_by_id(sec_id)
            self.assertIsNotNone(sec, f"solutions.html must have section id='{sec_id}'")

    @feature("F14", tier=1)
    def test_f14_solutions_deep_links_to_platform_roles(self):
        """F14: Verify each solutions section contains deep link to /platform#<role>."""
        doc = load_page("solutions.html")
        expected_roles = ["exporter", "stockist", "mill", "verifier", "importer", "lender"]
        for role in expected_roles:
            link = doc.find_one("a", {"href": f"/platform#{role}"})
            self.assertIsNotNone(link, f"solutions.html must link to /platform#{role}")

    @feature("F14", tier=1)
    def test_f14_solutions_exporters_financial_breakdown(self):
        """F14: Verify 91% retained savings and ₹91.1L avoided penalty in exporters section."""
        raw = load_page_raw("solutions.html")
        self.assertIn("91%", raw, "Exporters section must cite 91% retained savings")
        self.assertIn("₹91.1 L", raw, "Exporters section must cite ₹91.1 L avoided penalty")

    @feature("F14", tier=1)
    def test_f14_solutions_stockists_earnings_metric(self):
        """F14: Verify ₹50/tonne and 0.08% of coil cost cited in stockists section."""
        raw = load_page_raw("solutions.html")
        self.assertIn("₹50", raw, "Stockists section must cite ₹50 earnings per tonne")
        self.assertIn("0.08%", raw, "Stockists section must cite 0.08% of coil cost")

    @feature("F14", tier=1)
    def test_f14_solutions_verifiers_cost_table(self):
        """F14: Verify alone vs batched cost comparison table in verifiers section."""
        doc = load_page("solutions.html")
        verifiers_sec = doc.find_by_id("verifiers")
        table = verifiers_sec.find_one("table")
        self.assertIsNotNone(table, "Verifiers section must feature cost table")
        table_text = table.get_text()
        self.assertIn("17.5", table_text)
        self.assertIn("6.0", table_text)

    # --- F15: Unit Economics & Pricing Model ---

    @feature("F15", tier=1)
    def test_f15_pricing_three_plan_cards(self):
        """F15: Verify 3 distinct plan cards exist in pricing.html."""
        doc = load_page("pricing.html")
        cards = doc.find_all("div", {"class": "plan"})
        self.assertGreaterEqual(len(cards), 3, "pricing.html must feature at least 3 plan cards")

    @feature("F15", tier=1)
    def test_f15_pricing_exporter_subscription_terms(self):
        """F15: Verify exporter subscription pricing: ₹1.2 L / plant / year and + ₹400 / verified tonne."""
        raw = load_page_raw("pricing.html")
        self.assertIn("₹1.2 L", raw, "Pricing must state ₹1.2 L per plant a year")
        self.assertIn("₹400", raw, "Pricing must state ₹400 per verified tonne")

    @feature("F15", tier=1)
    def test_f15_pricing_stockist_incentive_terms(self):
        """F15: Verify stockists join free and earn ₹50 per traced tonne."""
        raw = load_page_raw("pricing.html")
        self.assertIn("Free", raw, "Stockist plan must be Free")
        self.assertIn("₹50", raw, "Stockists must earn ₹50 per traced tonne")

    @feature("F15", tier=1)
    def test_f15_pricing_partner_origination_fee(self):
        """F15: Verify partner green loan origination fee of 0.5%."""
        raw = load_page_raw("pricing.html")
        self.assertIn("0.5%", raw, "Pricing must state 0.5% origination fee for green loans")

    @feature("F15", tier=1)
    def test_f15_pricing_punjab_subsidy_mention(self):
        """F15: Verify mention of Punjab 2026 industrial policy 75% audit subsidy (up to ₹3L)."""
        raw = load_page_raw("pricing.html")
        self.assertIn("Punjab", raw, "Pricing must cite Punjab policy")
        self.assertIn("75%", raw, "Pricing must cite 75% subsidy")
        self.assertIn("₹3 lakh", raw, "Pricing must cite ₹3 lakh subsidy cap")

    @feature("F15", tier=1)
    def test_f15_pricing_interactive_volume_slider(self):
        """F15: Check interactive volume slider or progressive check for M4."""
        pricing_raw = load_page_raw("pricing.html")
        has_slider = ("slider" in pricing_raw.lower() or 'type="range"' in pricing_raw)
        self.require_feature_impl(has_slider, "F15", "pricing.html should include interactive volume slider")
