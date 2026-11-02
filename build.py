#!/usr/bin/env python3
"""Builds the static site: wraps every file in pages/ with the shared head, header and footer.

Each page starts with comment lines that set its metadata, for example:
  <!-- title: Pricing -->
  <!-- description: One line for search results -->
  <!-- page: pricing -->
  <!-- scripts: /assets/calc.js -->
Run `python3 build.py`, then commit the generated .html files at the repo root.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).parent
HEADER = (ROOT / "partials/header.html").read_text(encoding="utf-8")
FOOTER = (ROOT / "partials/footer.html").read_text(encoding="utf-8")

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0A0C0B">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Noto+Sans+Gurmukhi:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;600&display=swap" rel="stylesheet">
<script>(function(){{var P={{"8940":"molten","8941":"ledger","8942":"forest","8943":"cobalt"}};var q=new URLSearchParams(location.search).get("theme");var t=q||P[location.port]||"molten";if(t!=="molten")document.documentElement.setAttribute("data-theme",t);}})();</script>
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body data-page="{page}">
"""

for src in sorted((ROOT / "pages").glob("*.html")):
    text = src.read_text(encoding="utf-8")
    meta = dict(re.findall(r"<!--\s*(\w+):\s*(.*?)\s*-->", text.split("\n\n", 1)[0]))
    body = re.sub(r"^(\s*<!--\s*\w+:.*?-->\s*\n)+", "", text)
    title = meta.get("title", "Carbon Khata")
    full_title = title if title.startswith("Carbon Khata") else f"{title} · Carbon Khata"
    scripts = "".join(f'<script src="{s.strip()}"></script>\n' for s in meta.get("scripts", "").split(",") if s.strip())
    html = (HEAD.format(title=full_title, description=meta.get("description", ""), page=meta.get("page", src.stem))
            + HEADER + '<main id="main">\n' + body + "</main>\n" + FOOTER + scripts + "</body>\n</html>\n")
    (ROOT / src.name).write_text(html, encoding="utf-8")
    print("built", src.name)
