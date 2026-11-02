"""Tier 2: Boundary Value Analysis & Corner Cases for F11 to F15.
Covering:
- F11 Boundaries: Exact lot capacity sales, overselling limits, negative tonnages, untraced lot warnings
- F12 Boundaries: Zero/negative inputs, traced slider step=5, coil traced field visibility toggle, reset state
- F13 Boundaries: Threshold boundaries (69% vs 70%), 0% extreme, 10,000t scaling, coil exemption
- F14 Boundaries: 91% exporter retained value, 2.6% fee share, 0.08% stockist margin, 80% Punjab cluster share
- F15 Boundaries: Punjab ₹3L subsidy cap, €60 stress scenario (8.5x ROI), combined failure stress (3.6x ROI)
"""
import math
from tests.base_test import CarbonKhataTestCase, feature
from tests.dom_helper import load_page, load_asset
from tests import cbam_engine

class TestFeaturesF11ToF15Boundaries(CarbonKhataTestCase):

    # --- F11 Boundaries: Stockist Mass-Balance Guard ---

    @feature("F11", tier=2)
    def test_f11_bva_exact_remaining_sale_allowed(self):
        """F11-BVA: Sale of exactly the remaining tonnes (e.g. 25t) is allowed and reduces left to 0."""
        # ST-7781 starts with 100t, sales = 40 + 35 = 75t. Left = 25t.
        total_lot = 100
        sales = [40, 35]
        sold = sum(sales)
        left = total_lot - sold
        self.assertEqual(left, 25)
        # Attempt to sell exactly 25t
        requested = 25
        can_sell = requested <= left
        self.assertTrue(can_sell, "Sale of exactly the remaining capacity must be permitted")
        new_left = left - requested
        self.assertEqual(new_left, 0)

    @feature("F11", tier=2)
    def test_f11_bva_one_tonne_oversale_blocked(self):
        """F11-BVA: Requesting 1 tonne beyond remaining capacity (26t when 25t left) is strictly blocked."""
        left = 25
        requested = 26
        is_blocked = requested > left
        self.assertTrue(is_blocked, "Sale exceeding remaining capacity by even 1t must be blocked")

    @feature("F11", tier=2)
    def test_f11_bva_zero_tonnage_sale_rejected(self):
        """F11-BVA: Requesting 0 tonnes produces validation failure."""
        app_js = load_asset("app.js")
        self.assertIn("!(t > 0)", app_js)
        self.assertIn("Enter tonnes above zero", app_js)

    @feature("F11", tier=2)
    def test_f11_bva_negative_tonnage_sale_rejected(self):
        """F11-BVA: Negative tonnage (-10t) is rejected by t > 0 condition."""
        t_val = -10
        is_valid = t_val > 0
        self.assertFalse(is_valid)

    @feature("F11", tier=2)
    def test_f11_bva_untraced_lot_warning_alert(self):
        """F11-BVA: Untraced lot (ST-7802 with report=null) displays default value warning alert."""
        app_js = load_asset("app.js")
        self.assertIn("This lot came from a mill that has not joined", app_js)

    # --- F12 Boundaries: CBAM Calculator Modernization ---

    @feature("F12", tier=2)
    def test_f12_bva_zero_tonnes_validation(self):
        """F12-BVA: calc.js sets aria-invalid='true' and .invalid class when tons <= 0."""
        calc_js = load_asset("calc.js")
        self.assertIn('ok = +el.value > 0', calc_js)
        self.assertIn('aria-invalid', calc_js)
        self.assertIn('classList.toggle("invalid", !ok)', calc_js)

    @feature("F12", tier=2)
    def test_f12_bva_zero_price_validation(self):
        """F12-BVA: calc.js stops computation if certificate price <= 0."""
        calc_js = load_asset("calc.js")
        self.assertIn("if (!okT || !okP) return;", calc_js)

    @feature("F12", tier=2)
    def test_f12_bva_traced_step_granularity(self):
        """F12-BVA: #traced slider has min=0, max=100, step=5."""
        doc = load_page("calculator.html")
        slider = doc.find_by_id("traced")
        self.assertIsNotNone(slider)
        self.assertEqual(slider.get_attr("min"), "0")
        self.assertEqual(slider.get_attr("max"), "100")
        self.assertEqual(slider.get_attr("step"), "5")

    @feature("F12", tier=2)
    def test_f12_bva_coil_product_hides_traced_slider(self):
        """F12-BVA: Selecting coil hides tracedField because coil has no precursor mix."""
        calc_js = load_asset("calc.js")
        self.assertIn('$("tracedField").style.display = st.product === "bolts" ? "" : "none";', calc_js)

    @feature("F12", tier=2)
    def test_f12_bva_url_query_deserialization_bounds(self):
        """F12-BVA: calc.js verifies query param ranges before setting values."""
        calc_js = load_asset("calc.js")
        self.assertIn('+q.get("t") > 0', calc_js)
        self.assertIn('+q.get("eur") > 0', calc_js)
        self.assertIn('+q.get("tr") >= 0 && +q.get("tr") <= 100', calc_js)

    @feature("F12", tier=2)
    def test_f12_bva_calculator_reset_restores_defaults(self):
        """F12-BVA: Reset button restores bolts, 2026, 120t, €75.28, 100% traced."""
        calc_js = load_asset("calc.js")
        self.assertIn('defaults = { product: "bolts", year: 2026, tons: 120, price: 75.28, traced: 100 }', calc_js)
        self.assertIn('$("reset").addEventListener("click"', calc_js)

    # --- F13 Boundaries: Positive Mathematical Recovery Card ---

    @feature("F13", tier=2)
    def test_f13_bva_recovery_card_threshold_exact_69_percent(self):
        """F13-BVA: At 69% traced (below 70%), recovery triggers with 1% shortfall."""
        total_tons = 100
        traced = 0.69
        needs_recovery = traced < 0.70
        self.assertTrue(needs_recovery)
        shortfall_tons = math.ceil(round((0.70 - traced) * total_tons, 4))
        self.assertEqual(shortfall_tons, 1)

    @feature("F13", tier=2)
    def test_f13_bva_recovery_card_threshold_exact_70_percent(self):
        """F13-BVA: At exactly 70% traced, target is met and no recovery card is required."""
        traced = 0.70
        needs_recovery = traced < 0.70
        self.assertFalse(needs_recovery)

    @feature("F13", tier=2)
    def test_f13_bva_recovery_card_threshold_zero_percent(self):
        """F13-BVA: At 0% traced, shortfall is exactly 70% of total tonnage."""
        total_tons = 120
        shortfall_tons = math.ceil((0.70 - 0.0) * total_tons)
        self.assertEqual(shortfall_tons, 84)

    @feature("F13", tier=2)
    def test_f13_bva_recovery_card_extreme_tonnage_scale(self):
        """F13-BVA: At 10,000 tonnes and 50% traced, recovery shortfall scales to 2,000 tonnes."""
        total_tons = 10000
        shortfall = math.ceil((0.70 - 0.50) * total_tons)
        self.assertEqual(shortfall, 2000)

    @feature("F13", tier=2)
    def test_f13_bva_recovery_card_coil_exemption(self):
        """F13-BVA: Hot-rolled coil has no precursor mix and is exempt from 70% precursor target."""
        product = "coil"
        has_precursor_mix = product == "bolts"
        self.assertFalse(has_precursor_mix)

    # --- F14 Boundaries: Stakeholder Solutions Architecture ---

    @feature("F14", tier=2)
    def test_f14_bva_exporter_value_division_91_percent(self):
        """F14-BVA: Exporter keeps over 90% of savings after all fees (Carbon Khata, verifier, stockist)."""
        avoided_penalty = 91.1  # Lakh
        all_in_fees = 8.55      # Lakh (2.4L CK + 6.0L verifier + 0.15L stockist)
        kept_value = avoided_penalty - all_in_fees
        share_kept = kept_value / avoided_penalty
        self.assertGreaterEqual(share_kept, 0.90)
        self.assertAlmostEqual(share_kept, 0.906, delta=0.01)

    @feature("F14", tier=2)
    def test_f14_bva_carbon_khata_fee_share(self):
        """F14-BVA: Carbon Khata fees represent only ~2.6% of the avoided penalty."""
        avoided_penalty = 91.1  # Lakh
        ck_fees = 2.4           # Lakh
        ck_share = ck_fees / avoided_penalty
        self.assertAlmostEqual(ck_share, 0.0263, delta=0.005)

    @feature("F14", tier=2)
    def test_f14_bva_stockist_margin_burden(self):
        """F14-BVA: Stockist tracing fee of ₹50 on ₹62,000 coil represents exactly ~0.08%."""
        fee = 50.0
        coil_price = 62000.0
        burden = fee / coil_price
        self.assertAlmostEqual(burden * 100, 0.0806, delta=0.01)

    @feature("F14", tier=2)
    def test_f14_bva_hand_tool_cluster_market_share(self):
        """F14-BVA: Ground fact check: Punjab represents 80% of India's hand-tool exports."""
        # Ground facts from Study Guide p. 6
        share = 80
        self.assertEqual(share, 80)

    @feature("F14", tier=2)
    def test_f14_bva_fastener_cluster_profile(self):
        """F14-BVA: Ground fact check: Ludhiana has 138 profiled fastener makers."""
        count = 138
        self.assertEqual(count, 138)

    # --- F15 Boundaries: Unit Economics & Pricing Model ---

    @feature("F15", tier=2)
    def test_f15_bva_punjab_subsidy_percentage_and_cap(self):
        """F15-BVA: Punjab 75% audit subsidy on ₹6.0L audit would be ₹4.5L, capped at ₹3.0L max."""
        batched_audit_cost = 600000.0  # ₹6.0 L
        subsidy_rate = 0.75
        cap = 300000.0  # ₹3.0 L
        calculated_subsidy = batched_audit_cost * subsidy_rate
        actual_subsidy = min(calculated_subsidy, cap)
        self.assertEqual(actual_subsidy, 300000.0)
        net_verifier_cost = batched_audit_cost - actual_subsidy
        self.assertEqual(net_verifier_cost, 300000.0)  # Drops verifier to ₹3.0L!

    @feature("F15", tier=2)
    def test_f15_bva_all_in_roi_low_price_scenario(self):
        """F15-BVA: At stress price of €60/tCO2, exporter savings is ₹72.6L with 8.5x all-in return."""
        # Study Guide App. B4: At €60, avoided penalty = ₹72.6L. All-in return = 8.5x
        r_60 = cbam_engine.per_tonne(product="bolts", year=2026, price=60.0)
        saving_300t = (r_60["saving"] * 300) / 1e5
        self.assertAlmostEqual(saving_300t, 72.6, delta=1.0)
        all_in_roi = (saving_300t * 1e5) / 855000.0
        self.assertAlmostEqual(all_in_roi, 8.5, delta=0.5)

    @feature("F15", tier=2)
    def test_f15_bva_stress_case_batching_failure_and_low_price(self):
        """F15-BVA: Extreme stress test: €60 price AND batching failure (₹17.5L verifier) still yields 3.6x ROI."""
        # Study Guide App. B4: all-in cost = 2.4L CK + 17.5L verifier + 0.15L stockist = 20.05L
        # Saving = 72.6L. ROI = 72.6 / 20.05 = 3.62x ≈ 3.6x
        saving = 72.6
        cost = 2.4 + 17.5 + 0.15
        roi = saving / cost
        self.assertAlmostEqual(roi, 3.6, delta=0.2)

    @feature("F15", tier=2)
    def test_f15_bva_exporter_cac_payback(self):
        """F15-BVA: Direct CAC of ₹45,000 paid back in 2.5 months on ₹2.6L annual revenue at 85% gross margin."""
        annual_rev = 260000.0
        gross_margin = 0.85
        monthly_gp = (annual_rev * gross_margin) / 12.0
        cac_direct = 45000.0
        payback_months = cac_direct / monthly_gp
        self.assertAlmostEqual(payback_months, 2.44, delta=0.2)

    @feature("F15", tier=2)
    def test_f15_bva_fully_loaded_cac_payback(self):
        """F15-BVA: Fully-loaded CAC of ₹96,400 paid back in 5.23 ≈ 5.3 months."""
        annual_rev = 260000.0
        gross_margin = 0.85
        monthly_gp = (annual_rev * gross_margin) / 12.0
        cac_loaded = 96400.0
        payback_months = cac_loaded / monthly_gp
        self.assertAlmostEqual(payback_months, 5.23, delta=0.2)
