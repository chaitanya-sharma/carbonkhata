# Carbon Khata · E2E Automated Test Infrastructure

## Overview & Testing Philosophy

This test suite provides comprehensive, automated, opaque-box end-to-end verification for **Carbon Khata** (Team Carbon Khata, XLRI Delhi-NCR for Quest EY-Parthenon 2026). It verifies the static site compiler (`build.py`), the HTML application views, responsive design tokens, and the mathematical and regulatory calculations governing the EU Carbon Border Adjustment Mechanism (CBAM) under DG TAXUD implementing acts.

### 4-Tier Opaque-Box Methodology

The test suite is structured into four distinct, progressive testing tiers:

1. **Tier 1: Feature Coverage (Category-Partition Method)**
   - Systematic coverage of all 20 functional features (F1 to F20) cataloged in `PROJECT.md`.
   - Verifies primary behaviors (happy paths), structural DOM hierarchy, regulatory text presence, data model attributes, and build outputs.
   - At least 5 test cases per feature (104 tests total).

2. **Tier 2: Boundary Value Analysis (BVA & Edge Conditions)**
   - Rigorous testing of extreme inputs, zero boundaries, and stress points.
   - Covers minimum/maximum tonnages (1t to 100,000t), 0% to 100% precursor tracing, certificate price extremes (€1 to €300), viewport boundary conditions (375px mobile, 768px tablet, 1440px desktop), theme parameter overrides, phone number formats, and zero-floor non-negativity constraints.
   - At least 5 test cases per feature (103 tests total).

3. **Tier 3: Pairwise Combinatorial Testing**
   - Verification of 2-way cross-feature interactions between decoupled subsystems.
   - Examples: Calculator state serialization <-> Shared link restoration; Stockist mass-balance validation <-> Exporter weighted precursor calculation; Theme toggle parameter <-> Canvas particle colors; Navigation active page state <-> Document metadata matching.
   - 20 pairwise combination tests total.

4. **Tier 4: Real-World Workload Scenarios**
   - End-to-end simulation of multi-step, multi-stakeholder operational workflows described in the authoritative `Carbon_Khata_Study_Guide.pdf`.
   - Examples: 120t bolt shipment EU-2391 to Hamburg saving ₹36.4 Lakh; Stockist Mandi Gobindgarh splitting lot ST-7781 and enforcing mass-balance guard; Punjabi WhatsApp fuel slip OCR review; Verifier 10-site batching audit campaign; Lender green loan transition approval; 90-second competition live demo script walkthrough.
   - 15 real-world workload tests total.

**Total Test Count: 242 Automated Tests** (exceeding the >= 230 test requirement).

---

## Zero External Complex Dependencies

The test infrastructure runs strictly on the **Python standard library** with zero pip package requirements:
- `unittest`: Test case discovery, execution, assertions, and reporting.
- `html.parser.HTMLParser`: Custom DOM parsing and tree traversal (`tests/dom_helper.py`).
- `urllib.parse`: Query string serialization and link decoding.
- `subprocess`: Isolated execution of `build.py` and Node.js JavaScript syntax verification.
- `pathlib`: Cross-platform path handling for Windows PowerShell and POSIX environments.
- `re`: Regular expression matching for phone formats, CSS tokens, and meta tags.
- `json`: Parsing of `vercel.json` and simulation export payloads.

---

## Directory Structure

```
C:\Users\Janmejai\carbonkhata\tests\
├── __init__.py
├── test_runner.py                                 # Main CLI test runner with ANSI formatted output
├── base_test.py                                   # CarbonKhataTestCase base class & metadata decorators
├── dom_helper.py                                  # Standard library HTML parser & DOM tree inspector
├── cbam_engine.py                                 # Authoritative Python reference calculation engine
├── tier1_feature_coverage\                        # Tier 1: Functional feature coverage (104 tests)
│   ├── __init__.py
│   ├── test_f01_to_f05.py                         # F1–F5 coverage (26 tests)
│   ├── test_f06_to_f10.py                         # F6–F10 coverage (25 tests)
│   ├── test_f11_to_f15.py                         # F11–F15 coverage (27 tests)
│   └── test_f16_to_f20.py                         # F16–F20 coverage (26 tests)
├── tier2_boundaries\                              # Tier 2: Boundary value analysis (103 tests)
│   ├── __init__.py
│   ├── test_f01_to_f05_boundaries.py              # F1–F5 edge cases (26 tests)
│   ├── test_f06_to_f10_boundaries.py              # F6–F10 edge cases (25 tests)
│   ├── test_f11_to_f15_boundaries.py              # F11–F15 edge cases (26 tests)
│   └── test_f16_to_f20_boundaries.py              # F16–F20 edge cases (26 tests)
├── tier3_pairwise\                                # Tier 3: Cross-feature interactions (20 tests)
│   ├── __init__.py
│   └── test_cross_feature_combinations.py        # 20 pairwise combinatorial test cases
└── tier4_real_world\                              # Tier 4: Real-world operational workflows (15 tests)
    ├── __init__.py
    └── test_real_world_workloads.py               # 15 multi-step operational workflow simulations
```

---

## Feature Inventory Matrix (F1 to F20)

| Feature ID | Feature Name | Milestone | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total Tests | Authoritative Specification Source |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **F1** | The Three Anchoring Numbers | M2 | 5 | 5 | 0 | 3 | **13** | Study Guide p. 1 (₹30,400/t penalty, ₹36.4L shipment savings, ~70% data penalty) |
| **F2** | Debunk #1 Judge Misconception | M2 | 5 | 5 | 0 | 1 | **11** | Study Guide p. 2 (97.5% scales 1.53 EU benchmark, leaving 4.8 certs payable) |
| **F3** | Institutional Trust Anchor | M1 | 5 | 5 | 0 | 0 | **10** | ORIGINAL_REQUEST (XLRI Delhi-NCR, Quest EY-Parthenon 2026 credentials) |
| **F4** | Ambient Telemetry HUD | M1 | 5 | 5 | 1 | 0 | **11** | Survey 2 (EU ETS €75.28/tCO₂, ₹108 FX rate, Dec 2026 pilot launch) |
| **F5** | Master Design System Tokens | M1 | 6 | 6 | 1 | 0 | **13** | Survey 2 (Obsidian surface ladder, molten accent, typography, light scope) |
| **F6** | Header & Footer Navigation Harmony | M1 | 5 | 5 | 1 | 0 | **11** | Survey 1 (Active route indicators, footer solutions list with Lenders) |
| **F7** | Landing Page Hero & Flow Elevation | M2 | 5 | 5 | 1 | 0 | **11** | Survey 1, 2, 3 (Parallax depth cards, flow canvas, #mapTip element) |
| **F8** | Steel Supply Chain Journey | M2 | 5 | 5 | 0 | 0 | **10** | ORIGINAL_REQUEST (Odisha -> Mandi Gobindgarh -> Ludhiana -> Mundra -> Hamburg) |
| **F9** | The Three Pillars Presentation | M2 | 5 | 5 | 2 | 2 | **14** | Study Guide p. 3 (Precursor rail, -66% batched audit, Carbon-to-Cash lending) |
| **F10** | 7-Role Simulation Command Deck | M3 | 5 | 5 | 2 | 1 | **13** | Survey 2, 3 (7 working views, drawer dialog, JSON file export) |
| **F11** | Stockist Mass-Balance Guard | M3 | 5 | 5 | 1 | 1 | **12** | Study Guide p. 4 (Overselling strictly blocked, Tally Prime invoice tagging) |
| **F12** | CBAM Calculator Modernization | M4 | 6 | 6 | 2 | 0 | **14** | Survey 2, 3 (8-step walk, tons/price/traced inputs, URL state synchronization) |
| **F13** | Positive Mathematical Recovery Card | M4 | 5 | 5 | 1 | 0 | **11** | Survey 2 (Dynamic guidance when traced < 70%, exact tonnes shortfall) |
| **F14** | Stakeholder Solutions Architecture | M2 | 5 | 5 | 1 | 1 | **12** | Survey 1, 2 (6 persona sections with platform simulation deep links) |
| **F15** | Unit Economics & Pricing Model | M4 | 6 | 5 | 1 | 1 | **13** | Study Guide p. 5 (₹1.2L sub, ₹400/t, 10.7x ROI, Punjab 75% subsidy) |
| **F16** | Regulatory Trust & Custody Center | M4 | 5 | 5 | 1 | 2 | **13** | Survey 2 (Implementing acts table, DPDP Act 2023, AI audit policy) |
| **F17** | Ludhiana Pilot Intake Portal | M4 | 5 | 6 | 2 | 2 | **15** | Survey 2 (Pilot intake form, 10-digit phone regex, 50-firm cohort quota) |
| **F18** | 90-Second Guided Tour Controls | M2 | 5 | 5 | 1 | 1 | **12** | Survey 2 (8 scripted chapters, play/pause controls, keyboard shortcuts) |
| **F19** | Multi-Device Responsive Polish | M1 | 5 | 5 | 1 | 0 | **11** | ORIGINAL_REQUEST (Mobile 375px, tablet 768px, desktop 1440px, >=44px touch) |
| **F20** | Build & Deployment Verification | M1 | 6 | 5 | 1 | 0 | **12** | ORIGINAL_REQUEST (build.py clean exit, UTF-8 encoding, clean URLs) |
| **Total** | | | **104** | **103** | **20** | **15** | **242** | |

---

## Runner Invocation & CLI Usage

### Standard Execution (All Tiers)
Runs all 242 tests across Tiers 1–4. Returns exit code `0` on success, `1` on failure:
```powershell
python tests/test_runner.py
```

### Filtering by Tier
Run only a specific testing tier:
```powershell
python tests/test_runner.py --tier 1    # Feature Coverage (104 tests)
python tests/test_runner.py --tier 2    # Boundary Value Analysis (103 tests)
python tests/test_runner.py --tier 3    # Cross-Feature Combinations (20 tests)
python tests/test_runner.py --tier 4    # Real-World Workloads (15 tests)
```

### Filtering by Feature
Run all tests covering a specific feature ID (F1 to F20):
```powershell
python tests/test_runner.py --feature F1     # Anchoring Numbers tests (13 tests)
python tests/test_runner.py --feature F11    # Mass-balance guard tests (12 tests)
python tests/test_runner.py --feature F12    # CBAM Calculator tests (14 tests)
```

### Filtering by Milestone
Run only tests linked to a specific sprint milestone:
```powershell
python tests/test_runner.py --milestone M1   # Milestone 1 tests (68 tests)
```

### Strict Mode (Sprint Completion Verification)
Strict mode disallows any pending features and fails immediately if any planned sprint deliverables are incomplete:
```powershell
python tests/test_runner.py --strict
```

### Verbose Mode
Outputs individual test method names, pass status, and execution duration:
```powershell
python tests/test_runner.py -v
```

---

## Reference Oracles & Mathematical Verification

The test suite compares live code against the mathematical models derived in `tests/cbam_engine.py`, verified directly against `Carbon_Khata_Study_Guide.pdf`:

1. **Specific Embedded Emissions (SEE)**:
   - Wire rod default: $4.30 \times (1 + \mu_{\text{year}})$
   - Wire rod verified (weighted average, IR 2025/2547 Art. 14): $\sum (t_i \times \text{SEE}_i) / \sum t_i = 2.35 \text{ tCO}_2\text{/t}$
   - Exporter heat treatment process: $+0.05 \text{ tCO}_2\text{/t}$
   - Total verified bolt intensity: $2.35 + 0.05 = 2.40 \text{ tCO}_2\text{/t}$
   - Total default bolt intensity ($2026$): $5.72 \times 1.10 = 6.292 \text{ tCO}_2\text{/t}$

2. **Specific Free Allocation (SEFA) & Certificates**:
   - $2026$ Free allocation factor: $97.5\%$ ($0.975$)
   - Benchmark: Default filings use conservative $1.53 \text{ tCO}_2\text{/t}$; verified filings use $1.37 \text{ tCO}_2\text{/t}$
   - Deduction on default: $1.53 \times 0.975 = 1.49175 \text{ tCO}_2\text{/t}$
   - Certificates payable on default: $6.292 - 1.49175 = 4.80 \text{ certs/t}$
   - Certificates payable on verified: $2.40 - (1.37 \times 0.975) = 1.064 \text{ certs/t}$

3. **Financial Liabilities & Economics**:
   - Price multiplier $k$: $€75.28 \times ₹108 = ₹8,130.24 \text{ per certificate}$
   - Cost per default tonne: $4.80025 \times 8130.24 = ₹39,027 \approx ₹39,000\text{/t}$
   - Cost per verified tonne: $1.06425 \times 8130.24 = ₹8,653 \approx ₹8,700\text{/t}$
   - Avoidable data penalty: $₹30,374 \approx ₹30,400\text{ per tonne}$
   - 120t shipment savings: $120 \times ₹30,375 = ₹36.4\text{ Lakh}$
   - Exporter annual economics (300t): Avoided penalty $₹91.1\text{ Lakh}$; All-in cost $₹8.55\text{ Lakh}$; All-in ROI $10.7\times$; Retained share $91\%$.
