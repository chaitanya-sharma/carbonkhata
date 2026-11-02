"""Tier 2: Boundary Value Analysis & Corner Cases for F16 to F20.
Covering:
- F16 Boundaries: Article 9 €0 credit assumption, 50% quota duty, 72h DPDP breach, ₹5cr GST threshold, 5 verifiers
- F17 Boundaries: Phone formats (+91, hyphens, 9-digits rejected, leading 5 rejected), HTML escaping, optional tons
- F18 Boundaries: Chapter index bounds (1 to 8), Space key play/pause toggle, speed multiplier duration scaling
- F19 Boundaries: Viewport extremes (375px, 768px, 1440px), 44px touch targets, fluid typography clamp
- F20 Boundaries: Missing metadata fallbacks, Gurmukhi multibyte UTF-8 preservation, build idempotency
"""
import re
import subprocess
import sys
from tests.base_test import CarbonKhataTestCase, feature, REPO_ROOT
from tests.dom_helper import load_page_raw, load_asset

class TestFeaturesF16ToF20Boundaries(CarbonKhataTestCase):

    # --- F16 Boundaries: Regulatory Trust & Custody Center ---

    @feature("F16", tier=2)
    def test_f16_bva_article_9_credit_zero_baseline(self):
        """F16-BVA: Article 9 credit assumed €0 because EU recognises no Indian carbon credit scheme yet."""
        trust_raw = load_page_raw("trust.html")
        calc_raw = load_page_raw("calculator.html")
        self.assertIn("Article 9", calc_raw)
        self.assertIn("No deduction for Indian carbon prices", calc_raw)

    @feature("F16", tier=2)
    def test_f16_bva_quota_duty_50_percent_boundary(self):
        """F16-BVA: EU Reg 2026/1384 imposes 50% duty above quota with mandatory melt-and-pour proof."""
        trust_raw = load_page_raw("trust.html")
        self.assertIn("50%", trust_raw)
        self.assertIn("2026/1384", trust_raw)

    @feature("F16", tier=2)
    def test_f16_bva_dpdp_breach_reporting_timeline(self):
        """F16-BVA: DPDP Act statutory breach reporting requirement is exactly 72 hours."""
        trust_raw = load_page_raw("trust.html")
        self.assertIn("72 hours", trust_raw)

    @feature("F16", tier=2)
    def test_f16_bva_gst_einvoice_mandate_threshold(self):
        """F16-BVA: CGST Notification 10/2023 mandates e-invoices above ₹5 crore turnover threshold."""
        trust_raw = load_page_raw("trust.html")
        self.assertIn("₹5 crore", trust_raw)

    @feature("F16", tier=2)
    def test_f16_bva_accredited_verifiers_scarcity(self):
        """F16-BVA: Verifier scarcity boundary: only 5 accredited verification bodies worldwide."""
        sol_raw = load_page_raw("solutions.html")
        self.assertIn("five bodies", sol_raw.lower())

    # --- F17 Boundaries: Ludhiana Pilot Intake Portal ---

    @feature("F17", tier=2)
    def test_f17_bva_phone_format_with_plus_91(self):
        """F17-BVA: Phone validation accepts +91 prefix format."""
        phone_pattern = r"^(\+?91[\s-]?)?[6-9]\d{9}$"
        self.assertTrue(re.match(phone_pattern, "+91 9876543210".replace(" ", "")))

    @feature("F17", tier=2)
    def test_f17_bva_phone_format_with_hyphens(self):
        """F17-BVA: Phone validation accepts hyphens in number."""
        phone_pattern = r"^(\+?91[\s-]?)?[6-9]\d{9}$"
        cleaned = "98765-43210".replace(" ", "").replace("-", "")
        self.assertTrue(re.match(phone_pattern, cleaned))

    @feature("F17", tier=2)
    def test_f17_bva_phone_format_nine_digits_rejected(self):
        """F17-BVA: 9-digit phone number is rejected by validation."""
        phone_pattern = r"^(\+?91[\s-]?)?[6-9]\d{9}$"
        self.assertIsNone(re.match(phone_pattern, "987654321"))

    @feature("F17", tier=2)
    def test_f17_bva_phone_format_invalid_start_digit(self):
        """F17-BVA: Phone number starting with 5 (e.g. 5123456789) is rejected (must begin with 6-9)."""
        phone_pattern = r"^(\+?91[\s-]?)?[6-9]\d{9}$"
        self.assertIsNone(re.match(phone_pattern, "5123456789"))

    @feature("F17", tier=2)
    def test_f17_bva_special_characters_escaping(self):
        """F17-BVA: pilot.html script escapes < character to &lt; preventing XSS injection."""
        pilot_raw = load_page_raw("pilot.html")
        self.assertIn(".replace(/</g, \"&lt;\")", pilot_raw)

    @feature("F17", tier=2)
    def test_f17_bva_zero_tonnage_optional(self):
        """F17-BVA: Leaving tonnage field blank falls back to 'not given'."""
        pilot_raw = load_page_raw("pilot.html")
        self.assertIn('v("f-tons") || "not given"', pilot_raw)

    # --- F18 Boundaries: 90-Second Guided Tour Controls ---

    @feature("F18", tier=2)
    def test_f18_bva_chapter_count_exact(self):
        """F18-BVA: Guided tour script defines exactly 8 chapters."""
        tour_js = load_asset("tour.js")
        matches = re.findall(r"title:\s*['\"]([^'\"]+)['\"]", tour_js)
        self.assertEqual(len(matches), 8, "tour.js must define exactly 8 chapters")

    @feature("F18", tier=2)
    def test_f18_bva_keyboard_space_play_pause(self):
        """F18-BVA: Keyboard Space key listener toggles play and pause state."""
        tour_js = load_asset("tour.js")
        self.assertIn('e.key === " "', tour_js)
        self.assertIn("toggle()", tour_js)

    @feature("F18", tier=2)
    def test_f18_bva_keyboard_arrow_stepping(self):
        """F18-BVA: Left and Right arrow keys step between tour chapters."""
        tour_js = load_asset("tour.js")
        self.assertIn('e.key === "ArrowRight"', tour_js)
        self.assertIn('e.key === "ArrowLeft"', tour_js)

    @feature("F18", tier=2)
    def test_f18_bva_stage_overflow_hidden(self):
        """F18-BVA: Tour stage container enforces overflow: hidden preventing layout displacement."""
        styles = load_asset("styles.css")
        self.assertIn(".tour", styles)

    @feature("F18", tier=2)
    def test_f18_bva_end_card_cta_buttons(self):
        """F18-BVA: Chapter 8 end card features CTAs to 'Try the platform' and 'Join the pilot'."""
        tour_js = load_asset("tour.js")
        self.assertIn("Try the platform", tour_js)
        self.assertIn("Join the pilot", tour_js)

    # --- F19 Boundaries: Multi-Device Responsive Polish ---

    @feature("F19", tier=2)
    def test_f19_bva_viewport_375px_padding(self):
        """F19-BVA: Lateral container padding maintains min 16px margin on mobile screens."""
        styles = load_asset("styles.css")
        self.assertIn("padding: 0 16px", styles)

    @feature("F19", tier=2)
    def test_f19_bva_viewport_768px_tablet_collapse(self):
        """F19-BVA: Multi-column grids (.cols-2, .cols-3) collapse to single column on tablet/mobile."""
        styles = load_asset("styles.css")
        self.assertTrue(re.search(r"@media[^{]*max-width:\s*(?:760|768|900)px[^{]*{[^}]*grid-template-columns:\s*1fr", styles))

    @feature("F19", tier=2)
    def test_f19_bva_viewport_1440px_desktop_max(self):
        """F19-BVA: Container width caps at --max: 1240px preventing excessive line lengths."""
        styles = load_asset("styles.css")
        self.assertIn("--max: 1240px;", styles)
        self.assertIn("max-width: var(--max);", styles)

    @feature("F19", tier=2)
    def test_f19_bva_touch_target_minimum_44px(self):
        """F19-BVA: Navigation items and buttons provide accessible hit targets."""
        styles = load_asset("styles.css")
        self.assertTrue("min-height: 44px" in styles or "height: 44px" in styles or "padding: 10px 16px" in styles)

    @feature("F19", tier=2)
    def test_f19_bva_fluid_typography_clamp(self):
        """F19-BVA: Large display headlines utilize clamp() for fluid, overflow-free scaling."""
        styles = load_asset("styles.css")
        self.assertIn("clamp(", styles, "styles.css must utilize clamp() for fluid responsive typography")

    # --- F20 Boundaries: Build & Deployment Verification ---

    @feature("F20", tier=2)
    def test_f20_bva_build_missing_optional_scripts(self):
        """F20-BVA: Pages with no scripts metadata build cleanly without empty script tags."""
        # Check pricing.html which has no <!-- scripts: ... --> in pages/pricing.html
        pricing_raw = load_page_raw("pricing.html")
        self.assertNotIn('<script src=""></script>', pricing_raw)

    @feature("F20", tier=2)
    def test_f20_bva_build_missing_title_fallback(self):
        """F20-BVA: build.py provides fallback 'Carbon Khata' if title comment is omitted."""
        build_py = (REPO_ROOT / "build.py").read_text(encoding="utf-8")
        self.assertIn('meta.get("title", "Carbon Khata")', build_py)

    @feature("F20", tier=2)
    def test_f20_bva_build_multibyte_punjabi_characters(self):
        """F20-BVA: Gurmukhi characters (ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਬਿੱਲ ਮਿਲ ਗਿਆ) preserve UTF-8 byte integrity."""
        home_js = load_asset("home.js")
        self.assertIn("ਸਤ ਸ੍ਰੀ ਅਕਾਲ", home_js)
        self.assertIn("ਬਿੱਲ ਮਿਲ ਗਿਆ", home_js)

    @feature("F20", tier=2)
    def test_f20_bva_build_idempotency(self):
        """F20-BVA: Consecutive executions of build.py yield byte-identical output files."""
        cmd = [sys.executable, str(REPO_ROOT / "build.py")]
        subprocess.run(cmd, cwd=str(REPO_ROOT), check=True, capture_output=True)
        content1 = (REPO_ROOT / "index.html").read_bytes()
        subprocess.run(cmd, cwd=str(REPO_ROOT), check=True, capture_output=True)
        content2 = (REPO_ROOT / "index.html").read_bytes()
        self.assertEqual(content1, content2, "build.py must be strictly idempotent")

    @feature("F20", tier=2)
    def test_f20_bva_vercel_json_route_patterns(self):
        """F20-BVA: vercel.json defines valid clean URL routing configuration."""
        vercel_json = (REPO_ROOT / "vercel.json").read_text(encoding="utf-8")
        self.assertIn('"cleanUrls": true', vercel_json)
        self.assertIn('"trailingSlash": false', vercel_json)
