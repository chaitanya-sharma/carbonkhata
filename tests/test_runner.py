#!/usr/bin/env python3
"""Carbon Khata E2E Automated Test Suite Runner.
Executes opaque-box tests across 4 Tiers (Feature Coverage, Boundaries, Pairwise, Workloads)
covering all 20 features (F1 to F20) cataloged in PROJECT.md.

Usage:
    python tests/test_runner.py [options]

Options:
    --tier <1-4>         Run only specified tier
    --feature <F1-F20>   Run only tests covering specified feature ID
    --milestone <M1-M5>  Run only tests associated with specified milestone
    --strict             Fail if any feature implementations are pending
    -v, --verbose        Show verbose test execution details
    -h, --help           Show this help message and exit
"""
import argparse
import io
import os
import platform
import sys
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any

# Ensure UTF-8 stdout/stderr on Windows
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tests.base_test import FEATURE_REGISTRY

# ANSI Color Codes for terminal formatting
class TermColor:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    GREEN = "\033[32m"
    RED = "\033[31m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"
    MAGENTA = "\033[35m"
    WHITE = "\033[37m"

def supports_color() -> bool:
    """Check if console supports ANSI escape sequences."""
    return sys.stdout.isatty() or os.name == "nt" or "TERM" in os.environ

def color(text: str, code: str) -> str:
    if not supports_color():
        return text
    return f"{code}{text}{TermColor.RESET}"



class CustomTestResult(unittest.TestResult):
    """Custom test result collector tracking tier, feature, and milestone metrics."""
    def __init__(self, stream=None, descriptions=None, verbosity=1):
        super().__init__(stream, descriptions, verbosity)
        self.stream = stream or sys.stdout
        self.verbosity = verbosity
        self.test_details: List[Dict[str, Any]] = []
        self.start_time = 0.0

    def startTest(self, test):
        super().startTest(test)
        self.start_time = time.time()
        if self.verbosity > 1:
            method_name = getattr(test, "_testMethodName", str(test))
            self.stream.write(f"  * {method_name:<50} ")
            self.stream.flush()

    def addSuccess(self, test):
        super().addSuccess(test)
        elapsed = time.time() - self.start_time
        self._record(test, "PASS", elapsed)
        if self.verbosity > 1:
            self.stream.write(f"[{color('PASS', TermColor.GREEN)}] ({elapsed:.3f}s)\n")

    def addFailure(self, test, err):
        super().addFailure(test, err)
        elapsed = time.time() - self.start_time
        self._record(test, "FAIL", elapsed, err)
        if self.verbosity > 1:
            self.stream.write(f"[{color('FAIL', TermColor.RED)}] ({elapsed:.3f}s)\n")

    def addError(self, test, err):
        super().addError(test, err)
        elapsed = time.time() - self.start_time
        self._record(test, "ERROR", elapsed, err)
        if self.verbosity > 1:
            self.stream.write(f"[{color('ERROR', TermColor.RED)}] ({elapsed:.3f}s)\n")

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        elapsed = time.time() - self.start_time
        self._record(test, "PENDING", elapsed, reason=reason)
        if self.verbosity > 1:
            self.stream.write(f"[{color('PENDING', TermColor.YELLOW)}] ({reason})\n")

    def _record(self, test, status: str, elapsed: float, err=None, reason=""):
        method_name = getattr(test, "_testMethodName", str(test))
        method = getattr(test, method_name, None)
        feat_id = getattr(method, "_feature_id", "F20")
        tier = getattr(method, "_tier", 1)
        milestone = getattr(method, "_milestone", "M1")

        self.test_details.append({
            "test": test,
            "method_name": method_name,
            "feature_id": feat_id,
            "tier": tier,
            "milestone": milestone,
            "status": status,
            "elapsed": elapsed,
            "error": err,
            "reason": reason,
        })


def collect_test_suites(tier_filter=None, feature_filter=None, milestone_filter=None) -> unittest.TestSuite:
    """Discover all test cases and apply command-line filters."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    test_dirs = [
        REPO_ROOT / "tests" / "tier1_feature_coverage",
        REPO_ROOT / "tests" / "tier2_boundaries",
        REPO_ROOT / "tests" / "tier3_pairwise",
        REPO_ROOT / "tests" / "tier4_real_world",
        REPO_ROOT / "tests" / "tier5_adversarial",
    ]

    for t_dir in test_dirs:
        if not t_dir.exists():
            continue
        discovered = loader.discover(start_dir=str(t_dir), pattern="test_*.py", top_level_dir=str(REPO_ROOT))
        for test_item in _flatten_suite(discovered):
            method_name = getattr(test_item, "_testMethodName", "")
            method = getattr(test_item, method_name, None)
            feat_id = getattr(method, "_feature_id", None)
            tier = getattr(method, "_tier", None)
            m_stone = getattr(method, "_milestone", None)

            # Apply filters
            if tier_filter is not None and tier != tier_filter:
                continue
            if feature_filter is not None and feat_id != feature_filter:
                continue
            if milestone_filter is not None and m_stone != milestone_filter:
                continue

            suite.addTest(test_item)

    return suite


def _flatten_suite(suite_or_test):
    """Recursively flatten nested TestSuites into individual TestCases."""
    tests = []
    if isinstance(suite_or_test, unittest.TestSuite):
        for item in suite_or_test:
            tests.extend(_flatten_suite(item))
    else:
        tests.append(suite_or_test)
    return tests


def print_banner():
    banner = f"""
{color("================================================================================", TermColor.CYAN)}
{color("  CARBON KHATA - E2E AUTOMATED TEST SUITE RUNNER", TermColor.BOLD + TermColor.WHITE)}
{color("  4-Tier Opaque-Box Methodology | Features F1-F20 | Quest EY-Parthenon 2026", TermColor.CYAN)}
{color("================================================================================", TermColor.CYAN)}
  Platform:      Windows ({platform.platform()})
  Python:        {sys.version.split()[0]}
  Working Dir:   {REPO_ROOT}
  Timestamp:     {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%SZ')}
{color("--------------------------------------------------------------------------------", TermColor.DIM)}"""
    print(banner)


def print_tier_summary(details: List[Dict[str, Any]]):
    print(f"\n{color('-- TIER EXECUTION BREAKDOWN ---------------------------------------------------', TermColor.BOLD)}")
    tier_names = {
        1: "Tier 1 (Feature Coverage)",
        2: "Tier 2 (Boundary & Corner Cases)",
        3: "Tier 3 (Cross-Feature Combinations)",
        4: "Tier 4 (Real-World Workload Scenarios)",
        5: "Tier 5 (Adversarial Hardening)",
    }

    print(f"  {'Tier':<38} {'Total':<8} {'Pass':<8} {'Pending':<10} {'Fail':<8}")
    print(f"  {'-'*36} {'-'*6} {'-'*6} {'-'*8} {'-'*6}")

    for t_idx in [1, 2, 3, 4, 5]:
        t_tests = [d for d in details if d["tier"] == t_idx]
        total = len(t_tests)
        passed = sum(1 for d in t_tests if d["status"] == "PASS")
        pending = sum(1 for d in t_tests if d["status"] == "PENDING")
        failed = sum(1 for d in t_tests if d["status"] in ("FAIL", "ERROR"))

        pass_str = color(str(passed), TermColor.GREEN) if passed else "0"
        pend_str = color(str(pending), TermColor.YELLOW) if pending else "0"
        fail_str = color(str(failed), TermColor.RED) if failed else "0"

        print(f"  {tier_names[t_idx]:<38} {total:<8} {pass_str:<16} {pend_str:<18} {fail_str:<16}")


def print_feature_matrix(details: List[Dict[str, Any]]):
    print(f"\n{color('-- FEATURE COVERAGE INVENTORY (F1-F20) ----------------------------------------', TermColor.BOLD)}")
    print(f"  {'FID':<5} {'Feature Name':<34} {'M-Stone':<8} {'T1':<4} {'T2':<4} {'T3':<4} {'T4':<4} {'T5':<4} {'Tot':<5} {'Status'}")
    print(f"  {'-'*3} {'-'*32} {'-'*7} {'-'*3} {'-'*3} {'-'*3} {'-'*3} {'-'*3} {'-'*4} {'-'*10}")

    for fid in sorted(FEATURE_REGISTRY.keys(), key=lambda x: int(x[1:])):
        f_info = FEATURE_REGISTRY[fid]
        f_tests = [d for d in details if d["feature_id"] == fid]
        t1_c = sum(1 for d in f_tests if d["tier"] == 1)
        t2_c = sum(1 for d in f_tests if d["tier"] == 2)
        t3_c = sum(1 for d in f_tests if d["tier"] == 3)
        t4_c = sum(1 for d in f_tests if d["tier"] == 4)
        t5_c = sum(1 for d in f_tests if d["tier"] == 5)
        tot_c = len(f_tests)

        failed_c = sum(1 for d in f_tests if d["status"] in ("FAIL", "ERROR"))
        pending_c = sum(1 for d in f_tests if d["status"] == "PENDING")

        if failed_c > 0:
            status_str = color("FAILED", TermColor.RED)
        elif pending_c > 0 and (tot_c == pending_c):
            status_str = color("PENDING", TermColor.YELLOW)
        elif pending_c > 0:
            status_str = color("PARTIAL", TermColor.YELLOW)
        elif tot_c > 0:
            status_str = color("PASSED", TermColor.GREEN)
        else:
            status_str = color("NO TESTS", TermColor.DIM)

        name_trunc = (f_info['name'][:32] + "..") if len(f_info['name']) > 34 else f_info['name']
        print(f"  {fid:<5} {name_trunc:<34} {f_info['milestone']:<8} {t1_c:<4} {t2_c:<4} {t3_c:<4} {t4_c:<4} {t5_c:<4} {tot_c:<5} {status_str}")


def print_failures_and_errors(result: CustomTestResult):
    if not result.failures and not result.errors:
        return

    print(f"\n{color('-- FAILURE & ERROR DETAILS -----------------------------------------------------', TermColor.RED + TermColor.BOLD)}")
    for test, err in result.failures:
        print(f"\n{color('FAIL:', TermColor.RED)} {test}")
        print(err)
    for test, err in result.errors:
        print(f"\n{color('ERROR:', TermColor.RED)} {test}")
        print(err)


def main():
    parser = argparse.ArgumentParser(description="Carbon Khata E2E Automated Test Suite Runner")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4, 5], help="Run only specified tier")
    parser.add_argument("--feature", type=str, help="Run only specified feature (e.g. F1, F12)")
    parser.add_argument("--milestone", type=str, help="Run only specified milestone (e.g. M1, M2)")
    parser.add_argument("--strict", action="store_true", help="Fail if any features are pending")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose test execution")
    args = parser.parse_args()

    if args.strict:
        os.environ["CK_TEST_STRICT"] = "1"

    print_banner()

    feature_filter = args.feature.upper() if args.feature else None
    milestone_filter = args.milestone.upper() if args.milestone else None

    suite = collect_test_suites(
        tier_filter=args.tier,
        feature_filter=feature_filter,
        milestone_filter=milestone_filter
    )

    total_discovered = suite.countTestCases()
    print(f"  Discovered:    {color(str(total_discovered), TermColor.BOLD)} test cases across active test modules")
    if args.tier:
        print(f"  Tier Filter:   Tier {args.tier}")
    if feature_filter:
        print(f"  Feat Filter:   Feature {feature_filter}")
    if milestone_filter:
        print(f"  M-Stone Filter:Milestone {milestone_filter}")
    if args.strict:
        print(f"  Mode:          {color('STRICT (Zero Pending Allowed)', TermColor.YELLOW)}")

    print(f"\n{color('-- EXECUTING TEST CASES --------------------------------------------------------', TermColor.BOLD)}")
    start_wall = time.time()
    result = CustomTestResult(verbosity=2 if args.verbose else 1)
    suite.run(result)
    duration = time.time() - start_wall

    print_tier_summary(result.test_details)
    print_feature_matrix(result.test_details)
    print_failures_and_errors(result)

    total_run = len(result.test_details)
    passed_count = sum(1 for d in result.test_details if d["status"] == "PASS")
    pending_count = sum(1 for d in result.test_details if d["status"] == "PENDING")
    failed_count = sum(1 for d in result.test_details if d["status"] in ("FAIL", "ERROR"))

    verdict_color = TermColor.GREEN if failed_count == 0 else TermColor.RED
    verdict_text = "ALL TESTS PASSED" if failed_count == 0 else f"{failed_count} TEST(S) FAILED"

    print(f"\n{color('================================================================================', TermColor.CYAN)}")
    print(f"  FINAL VERDICT: {color(verdict_text, verdict_color + TermColor.BOLD)}")
    print(f"  Total: {total_run} | Passed: {color(str(passed_count), TermColor.GREEN)} | Pending (Sprints M2-M4): {color(str(pending_count), TermColor.YELLOW)} | Failed: {color(str(failed_count), TermColor.RED if failed_count else TermColor.DIM)}")
    print(f"  Total Duration: {duration:.3f} seconds")
    print(f"{color('================================================================================', TermColor.CYAN)}\n")

    sys.exit(0 if failed_count == 0 else 1)


if __name__ == "__main__":
    main()
