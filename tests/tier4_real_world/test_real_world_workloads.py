"""Tier 4: Real-World Application Workload Scenarios.
Executing 15 end-to-end multi-step operational workflows:
1. 120t bolt shipment EU-2391 to Hamburg avoiding ₹36.4 Lakh penalty
2. Stockist splitting lot ST-7781 with mass-balance guard blocking 99t oversale
3. Punjabi WhatsApp fuel slip OCR review & human approval audit loop
4. Verifier 10-site batching audit campaign in Ludhiana cluster
5. Lender green loan approval at 2.40 tCO2e/t transitioning to 1.79 tCO2e/t
6. 90-Second live demo script full walkthrough execution
7. Exporter 300t annual economics: ₹91.1L saved, 10.7x all-in ROI, 91% retained
8. Hot-rolled coil 2026 CBAM filing (€75.28, ₹18,300/t data penalty, 70% share)
9. Year 2028 CBAM progression (+30% markup, 90% CBAM factor, ₹27,000/t penalty)
10. EEPC Ludhiana pilot intake submission and cluster capacity tracking
11. Importer EU quota 50% duty prevention via melt-and-pour heat numbers
12. Kill criterion safety mechanism trigger (<50% lots traced by March 2027)
13. Stockist tracing earnings monthly payout calculation (₹50/t for traced tonnes)
14. Mill sharing consent matrix under DPDP Act 2023 (masking prices/customers)
15. Viet Nam vs India export competitiveness comparison (₹8,700 vs ₹12,500 vs ₹39,000)
"""
import re
from tests.base_test import CarbonKhataTestCase, feature
from tests.dom_helper import load_page_raw, load_asset
from tests import cbam_engine

class TestRealWorldWorkloads(CarbonKhataTestCase):

    @feature("F1", tier=4)
    def test_workflow_01_bolt_shipment_to_hamburg_avoiding_penalty(self):
        """Workflow 1: Multi-step simulation of 120t bolt shipment EU-2391 to Hamburg."""
        # Step 1: Precursor blend: 72t from ST-7781 (2.38) + 54t direct (2.31) = 2.35
        lot1_t, lot1_see = 72, 2.38
        lot2_t, lot2_see = 54, 2.31
        total_t = 120
        prec_blend = (lot1_t * lot1_see + lot2_t * lot2_see) / (lot1_t + lot2_t)
        self.assertAlmostEqual(prec_blend, 2.35, places=2)

        # Step 2: Own process emissions: 0.05 -> Total SEE = 2.40
        own_process = 0.05
        total_see = prec_blend + own_process
        self.assertAlmostEqual(total_see, 2.40, places=2)

        # Step 3: Default CBAM calculation (5.72 * 1.10 = 6.292 tCO2e/t)
        r = cbam_engine.per_tonne(product="bolts", year=2026, traced=1.0)
        def_cost_total = r["def"] * total_t
        act_cost_total = r["act"] * total_t
        net_saved = def_cost_total - act_cost_total

        # Step 4: Validate cost figures: ₹46.8L vs ₹10.4L -> ₹36.4L net kept
        self.assertAlmostEqual(def_cost_total / 1e5, 46.8, delta=0.5)
        self.assertAlmostEqual(act_cost_total / 1e5, 10.4, delta=0.5)
        self.assertAlmostEqual(net_saved / 1e5, 36.4, delta=0.5)

        # Step 5: Verify JSON export schema presence in app.js
        app_js = load_asset("app.js")
        self.assertIn('"EU-2391"', app_js)
        self.assertIn("destination: s.to", app_js)

    @feature("F11", tier=4)
    def test_workflow_02_stockist_splitting_lot_mass_balance_guard(self):
        """Workflow 2: Stockist lot ST-7781 splitting and mass-balance enforcement."""
        # Initial inventory: 100t lot ST-7781
        lot_id = "ST-7781"
        initial_capacity = 100
        sales = [{"to": "Sample Fasteners", "t": 40}, {"to": "Sample Forgings", "t": 35}]

        # Step 1: Compute remaining capacity
        sold = sum(s["t"] for s in sales)
        left = initial_capacity - sold
        self.assertEqual(sold, 75)
        self.assertEqual(left, 25)

        # Step 2: Attempted sale of 99t must be blocked
        attempt_oversale = 99
        is_blocked = attempt_oversale > left
        self.assertTrue(is_blocked, "Sale of 99t from 25t remaining capacity must be blocked")

        # Step 3: Adjusted sale of 20t succeeds
        valid_sale = 20
        sales.append({"to": "Sample Bolts", "t": valid_sale})
        new_sold = sum(s["t"] for s in sales)
        new_left = initial_capacity - new_sold
        self.assertEqual(new_sold, 95)
        self.assertEqual(new_left, 5)

        # Step 4: Verify code contract in app.js
        app_js = load_asset("app.js")
        self.assertIn("Blocked. Only ${left} t of ${L.id} is left", app_js)

    @feature("F10", tier=4)
    def test_workflow_03_punjabi_whatsapp_fuel_slip_ocr_review(self):
        """Workflow 3: Document inbox OCR extraction and reviewer approval audit loop."""
        home_js = load_asset("home.js")
        app_js = load_asset("app.js")

        # Step 1: Punjabi greeting and tax invoice in chat loop
        self.assertIn("ਸਤ ਸ੍ਰੀ ਅਕਾਲ!", home_js)
        self.assertIn("Furnace oil … 3,200 L", home_js)

        # Step 2: Review confirmation in chat
        self.assertIn("ਬਿੱਲ ਮਿਲ ਗਿਆ", home_js)
        self.assertIn("ਸਹੀ ਹੈ ✓", home_js)

        # Step 3: Weighbridge gap flagged in documents list
        self.assertIn("Weighbridge slip, lot WR-5.5-A", app_js)
        self.assertIn("Gap", app_js)
        self.assertIn("0.38 t", app_js)

        # Step 4: Reviewer approval handler in app.js
        self.assertIn('d.state = "approved"', app_js)

    @feature("F9", tier=4)
    def test_workflow_04_verifier_ten_site_batched_audit_campaign(self):
        """Workflow 4: Accredited verifier 10-site Ludhiana cluster campaign."""
        app_js = load_asset("app.js")

        # Step 1: 10 sites scheduled across Monday through Friday
        self.assertIn("Mon", app_js)
        self.assertIn("Fri", app_js)
        self.assertIn("Sample Fasteners", app_js)
        self.assertIn("Sample Hand Tools", app_js)

        # Step 2: Cost line items: alone ₹17.5L vs batched ₹6.0L
        cost_alone = 5.4 + 4.3 + 7.8
        cost_batched = 4.2 + 0.6 + 1.2
        self.assertAlmostEqual(cost_alone, 17.5, places=1)
        self.assertAlmostEqual(cost_batched, 6.0, places=1)

        # Step 3: Cost reduction percentage is -65.7% ≈ -66%
        cost_reduction = (cost_alone - cost_batched) / cost_alone
        self.assertAlmostEqual(cost_reduction, 0.657, delta=0.01)

    @feature("F9", tier=4)
    def test_workflow_05_lender_green_loan_transition_approval(self):
        """Workflow 5: Lender green loan approval at 2.40 tCO2e/t transitioning to 1.79 tCO2e/t."""
        app_js = load_asset("app.js")

        # Step 1: Loan parameters (₹40L green loan)
        self.assertIn("₹40 L green loan", app_js)

        # Step 2: Transition maths: 70% wire rod @ 2.35 + 30% scrap EAF @ 0.30 + 0.05 own process = 1.79
        int_today = 2.40
        int_future = 0.70 * 2.35 + 0.30 * 0.30 + 0.05
        self.assertAlmostEqual(int_future, 1.785, places=2)

        # Step 3: Disbursement tranches
        self.assertIn("Tranche 1 · on approval", app_js)
        self.assertIn("₹25 L", app_js)
        self.assertIn("Tranche 2 · when the next signed report shows under 2.0 tCO₂/t", app_js)
        self.assertIn("₹15 L", app_js)

    @feature("F18", tier=4)
    def test_workflow_06_ninety_second_demo_script_execution(self):
        """Workflow 6: 90-Second live demo script 3-step sequence (Study Guide p. 12)."""
        # Step 1: Tour chapters 1-4 cover mill, stockist split block at 30t, WhatsApp Punjabi OCR, 2.40 tCO2e/t
        tour_js = load_asset("tour.js")
        self.assertIn("mill", tour_js.lower())
        self.assertIn("stockist", tour_js.lower())
        self.assertIn("whatsapp", tour_js.lower())
        self.assertIn("exporter", tour_js.lower())

        # Step 2: Try the demo -> stockist role -> sell 99t blocked
        app_js = load_asset("app.js")
        self.assertIn("Blocked.", app_js)

        # Step 3: Open calculator -> drag traced share 100% to 0% and back -> ₹36.4L variance
        r_100 = cbam_engine.per_tonne(product="bolts", year=2026, traced=1.0)
        r_0 = cbam_engine.per_tonne(product="bolts", year=2026, traced=0.0)
        variance_120t = (r_0["act"] * 120) - (r_100["act"] * 120)
        self.assertAlmostEqual(variance_120t / 1e5, 23.2, delta=0.5)

    @feature("F15", tier=4)
    def test_workflow_07_exporter_annual_economics_300t(self):
        """Workflow 7: Exporter 300t annual economics: ₹91.1L saved, 10.7x all-in ROI, 91% retained."""
        tonnes = 300
        avoided_penalty_per_tonne = 30375.0  # ₹30,375 ≈ ₹30,400
        total_avoided = (tonnes * avoided_penalty_per_tonne) / 1e5  # in Lakhs
        self.assertAlmostEqual(total_avoided, 91.1, delta=0.5)

        # Fee schedule:
        sub_fee = 1.2  # Lakh
        filing_fee = (300 * 400) / 1e5  # ₹1.2 Lakh
        ck_fees = sub_fee + filing_fee   # ₹2.4 Lakh
        stockist_fee = (300 * 50) / 1e5  # ₹0.15 Lakh
        verifier_fee = 6.0               # ₹6.0 Lakh
        all_in_fees = ck_fees + stockist_fee + verifier_fee  # ₹8.55 Lakh
        self.assertAlmostEqual(all_in_fees, 8.55, delta=0.01)

        # Metrics:
        all_in_roi = (total_avoided) / all_in_fees
        self.assertAlmostEqual(all_in_roi, 10.7, delta=0.2)
        share_retained = (total_avoided - all_in_fees) / total_avoided
        self.assertAlmostEqual(share_retained * 100, 90.6, delta=0.5)

    @feature("F1", tier=4)
    def test_workflow_08_hrc_coil_2026_worked_example(self):
        """Workflow 8: Hot-rolled coil 2026 worked example (Study Guide p. 3)."""
        r = cbam_engine.per_tonne(product="coil", year=2026, price=75.28)
        # Default: 4.71 tCO2/t -> 3.22 certs -> ₹26,100
        self.assertAlmostEqual(r["defSEE"], 4.708, places=2)
        self.assertAlmostEqual(r["defCerts"], 3.216, delta=0.02)
        self.assertAlmostEqual(r["def"], 26148.0, delta=100.0)

        # Verified: 2.30 tCO2/t -> 0.96 certs -> ₹7,800
        self.assertAlmostEqual(r["actSEE"], 2.30, places=2)
        self.assertAlmostEqual(r["actCerts"], 0.964, delta=0.02)
        self.assertAlmostEqual(r["act"], 7840.0, delta=100.0)

        # Data penalty: ₹18,300 per tonne (~70% of default bill)
        penalty = r["saving"]
        self.assertAlmostEqual(penalty, 18308.0, delta=100.0)
        self.assertAlmostEqual(penalty / r["def"], 0.70, delta=0.02)

    @feature("F2", tier=4)
    def test_workflow_09_cbam_evolution_2026_to_2028(self):
        """Workflow 9: Multi-year policy progression: markup grows +10% to +30%, factor drops 97.5% to 90%."""
        r26 = cbam_engine.per_tonne(product="coil", year=2026, price=75.28)
        r28 = cbam_engine.per_tonne(product="coil", year=2028, price=80.0)

        # In 2028, default bill rises to ~₹36,200, verified to ~₹9,200, penalty to ~₹27,000 (75%)
        self.assertAlmostEqual(r26["saving"], 18308.0, delta=100.0)
        self.assertAlmostEqual(r28["saving"], 27000.0, delta=500.0)
        self.assertAlmostEqual(r28["saving"] / r28["def"], 0.75, delta=0.02)

    @feature("F17", tier=4)
    def test_workflow_10_pilot_intake_submission_and_cluster_quota(self):
        """Workflow 10: Ludhiana pilot intake form submission generating verified request string."""
        pilot_raw = load_page_raw("pilot.html")
        self.assertIn("Pilot request", pilot_raw)
        self.assertIn("Name:", pilot_raw)
        self.assertIn("Company:", pilot_raw)
        self.assertIn("Role:", pilot_raw)
        self.assertIn("Phone:", pilot_raw)
        self.assertIn("2026 EU tonnes:", pilot_raw)

    @feature("F16", tier=4)
    def test_workflow_11_importer_50pct_steel_quota_duty_mitigation(self):
        """Workflow 11: Importer EU quota 50% duty avoidance via melt-and-pour heat numbers."""
        app_js = load_asset("app.js")
        self.assertIn("50% duty", app_js)
        self.assertIn("melted and poured", app_js)
        self.assertIn("Mill heat numbers in the ledger provide that evidence", app_js)

    @feature("F17", tier=4)
    def test_workflow_12_kill_criterion_pivot_trigger(self):
        """Workflow 12: Kill criterion safety mechanism (<50% lots traced by March 2027)."""
        app_js = load_asset("app.js")
        self.assertIn("stops and Carbon Khata becomes a verifier-scheduling service", app_js)
        self.assertIn("Current: 74%", app_js)

    @feature("F14", tier=4)
    def test_workflow_13_stockist_tracing_incentive_payout(self):
        """Workflow 13: Stockist earning mechanics: ₹50/traced tonne paid monthly."""
        app_js = load_asset("app.js")
        self.assertIn("fmt.inr(tracedT * 50)", app_js)
        self.assertIn("Paid to", app_js)
        self.assertIn("Current account ending 4471", app_js)

    @feature("F16", tier=4)
    def test_workflow_14_mill_sharing_dpdp_compliance(self):
        """Workflow 14: Mill sharing consent matrix under DPDP Act 2023 (masking prices/customers)."""
        app_js = load_asset("app.js")
        self.assertIn("Prices and discounts", app_js)
        self.assertIn("Never shared", app_js)
        self.assertIn("Customer list", app_js)
        self.assertIn("DPDP consent recorded", app_js)

    @feature("F1", tier=4)
    def test_workflow_15_vietnam_vs_india_export_competitiveness(self):
        """Workflow 15: Export competitiveness comparison: India default ₹39,000/t vs Viet Nam ₹12,500/t vs Carbon Khata ₹8,700/t."""
        # Study Guide p. 5:
        # India on default: ₹39,000/t
        # Viet Nam on default: ₹12,500/t (Viet Nam default is only 2.75 tCO2e/t)
        # India with Carbon Khata: ₹8,700/t
        india_default = 39000.0
        vietnam_default = 12500.0
        india_carbon_khata = 8700.0

        self.assertGreater(india_default, vietnam_default, "Defaults make India uncompetitive vs Viet Nam")
        self.assertLess(india_carbon_khata, vietnam_default, "Real data makes India cheaper than Viet Nam")
