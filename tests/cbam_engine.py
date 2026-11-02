"""Authoritative EU CBAM Reference Calculation Engine and Oracles.
Implements the exact formulas and numbers from the Carbon Khata Study Guide:
- Regulation (EU) 2023/956
- Implementing Regulations 2025/2547 (methods, Art. 14 precursors)
- 2025/2620 (free-allocation adjustment)
- 2025/2621 as amended by 2026/1740 (default values and mark-up)
"""
from typing import Dict, Any, Union

FX = 108.0
PRICE_2026 = 75.28

CBAM_FACTOR = {
    2026: 0.975,
    2027: 0.950,
    2028: 0.900,
}

MARKUP = {
    2026: 0.10,
    2027: 0.20,
    2028: 0.30,
}

BENCH = {
    "default": 1.53,
    "actual": 1.37,
}

PRODUCTS = {
    "bolts": {
        "label": "Bolts and screws",
        "cn": "CN 7318 15",
        "def": 5.72,
        "precursorDef": 4.30,
        "precursorActual": 2.35,
        "ownProcess": 0.05,
    },
    "coil": {
        "label": "Hot-rolled coil",
        "cn": "CN 7208",
        "def": 4.28,
        "actual": 2.30,
    },
}

def calc_certs(see: float, bench: float, year: int) -> float:
    """Calculate certificates per tonne: max(see - bench * CBAM_FACTOR[year], 0)."""
    return max(see - bench * CBAM_FACTOR[year], 0.0)

def per_tonne(
    product: str = "bolts",
    year: int = 2026,
    price: float = PRICE_2026,
    traced: float = 1.0
) -> Dict[str, Any]:
    """Calculate per-tonne figures in INR and tCO2 for specified parameters."""
    if product not in PRODUCTS:
        raise ValueError(f"Unknown product: {product}")
    if year not in MARKUP:
        raise ValueError(f"Unsupported year: {year}")

    p = PRODUCTS[product]
    k = price * FX
    mu = MARKUP[year]
    def_see = p["def"] * (1.0 + mu)

    if product == "bolts":
        prec_def = p["precursorDef"] * (1.0 + mu)
        act_see = traced * p["precursorActual"] + (1.0 - traced) * prec_def + p["ownProcess"]
        no_mill_see = prec_def + p["ownProcess"]
    else:
        act_see = p["actual"]
        no_mill_see = def_see

    def_certs = calc_certs(def_see, BENCH["default"], year)
    act_certs = calc_certs(act_see, BENCH["actual"], year)
    no_mill_bench = BENCH["actual"] if product == "bolts" else BENCH["default"]
    no_mill_certs = calc_certs(no_mill_see, no_mill_bench, year)

    def_cost = def_certs * k
    act_cost = act_certs * k
    no_mill_cost = no_mill_certs * k
    saving = def_cost - act_cost

    return {
        "defSEE": def_see,
        "actSEE": act_see,
        "noMillSEE": no_mill_see,
        "defCerts": def_certs,
        "actCerts": act_certs,
        "noMillCerts": no_mill_certs,
        "factor": CBAM_FACTOR[year],
        "markup": mu,
        "k": k,
        "def": def_cost,
        "act": act_cost,
        "noMill": no_mill_cost,
        "saving": saving,
    }

# Formatting utilities mirroring site.js fmt
def fmt_inr(v: Union[int, float]) -> str:
    """Format currency as whole Indian Rupee: ₹X,XX,XXX."""
    rounded = round(v)
    # Simple Indian comma formatting
    s = str(abs(rounded))
    if len(s) <= 3:
        res = s
    else:
        res = s[-3:]
        s = s[:-3]
        while len(s) > 2:
            res = s[-2:] + "," + res
            s = s[:-2]
        if s:
            res = s + "," + res
    return ("-₹" if rounded < 0 else "₹") + res

def fmt_inr100(v: Union[int, float]) -> str:
    """Format currency rounded to nearest hundred: ₹X,XX,X00."""
    return fmt_inr(round(v / 100.0) * 100)

def fmt_lakh(v: Union[int, float], d: int = 1) -> str:
    """Format value in Lakhs: ₹XX.X L."""
    lakhs = v / 100000.0
    return f"₹{lakhs:.{d}f} L"

def fmt_t2(v: float) -> str:
    """Format float with two decimals."""
    return f"{v:.2f}"

def fmt_eur(v: Union[int, float]) -> str:
    """Format value in Euros."""
    return f"€{round(v):,}"
