"""DOM Parsing and Inspection Helper for Carbon Khata E2E Tests.
Uses standard library html.parser with zero external dependencies.
"""
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Any

REPO_ROOT = Path(__file__).resolve().parent.parent

class DOMNode:
    """Represents an HTML DOM element in the parsed tree."""
    def __init__(self, tag: str, attrs: Dict[str, str], parent: Optional['DOMNode'] = None):
        self.tag = tag.lower()
        self.attrs = {k.lower(): v for k, v in attrs.items()}
        self.parent = parent
        self.children: List[Any] = []  # Can contain DOMNode or str

    def add_child(self, child: Any):
        self.children.append(child)

    def get_attr(self, name: str, default: Optional[str] = None) -> Optional[str]:
        return self.attrs.get(name.lower(), default)

    def has_attr(self, name: str) -> bool:
        return name.lower() in self.attrs

    def has_class(self, class_name: str) -> bool:
        classes = self.get_attr("class", "").split()
        return class_name in classes

    def get_text(self, strip: bool = True) -> str:
        texts = []
        for child in self.children:
            if isinstance(child, str):
                texts.append(child)
            elif isinstance(child, DOMNode):
                texts.append(child.get_text(strip=False))
        joined = " ".join(texts)
        if strip:
            return " ".join(joined.split())
        return joined

    def find_by_id(self, target_id: str) -> Optional['DOMNode']:
        target_id_lower = target_id.lower()
        if self.get_attr("id", "").lower() == target_id_lower:
            return self
        for child in self.children:
            if isinstance(child, DOMNode):
                res = child.find_by_id(target_id)
                if res:
                    return res
        return None

    def find_all(self, tag: Optional[str] = None, attrs: Optional[Dict[str, Any]] = None) -> List['DOMNode']:
        matches = []
        tag_lower = tag.lower() if tag else None
        
        matches_tag = tag_lower is None or self.tag == tag_lower
        matches_attrs = True
        if attrs:
            for k, v in attrs.items():
                k_lower = k.lower()
                if k_lower == "class":
                    if not self.has_class(v):
                        matches_attrs = False
                        break
                elif self.get_attr(k_lower) != str(v):
                    matches_attrs = False
                    break

        if matches_tag and matches_attrs:
            matches.append(self)

        for child in self.children:
            if isinstance(child, DOMNode):
                matches.extend(child.find_all(tag, attrs))
        return matches

    def find_one(self, tag: Optional[str] = None, attrs: Optional[Dict[str, Any]] = None) -> Optional['DOMNode']:
        all_found = self.find_all(tag, attrs)
        return all_found[0] if all_found else None

    def __repr__(self):
        id_str = f" id='{self.get_attr('id')}'" if self.has_attr('id') else ""
        cls_str = f" class='{self.get_attr('class')}'" if self.has_attr('class') else ""
        return f"<{self.tag}{id_str}{cls_str}>"


class TreeBuilderParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = DOMNode("document", {})
        self.current = self.root
        self.void_tags = {
            "area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"
        }

    def handle_starttag(self, tag, attrs):
        attr_dict = {k: v for k, v in attrs if k}
        node = DOMNode(tag, attr_dict, parent=self.current)
        self.current.add_child(node)
        if tag.lower() not in self.void_tags:
            self.current = node

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in self.void_tags:
            return
        curr = self.current
        while curr and curr.parent:
            if curr.tag == tag_lower:
                self.current = curr.parent
                break
            curr = curr.parent

    def handle_data(self, data):
        if data:
            self.current.add_child(data)


def parse_html(html_str: str) -> DOMNode:
    """Parse HTML string into a DOMNode tree."""
    parser = TreeBuilderParser()
    parser.feed(html_str)
    return parser.root


def load_page(page_name: str) -> DOMNode:
    """Load built root HTML file (e.g. 'index.html')."""
    if not page_name.endswith(".html"):
        page_name += ".html"
    path = REPO_ROOT / page_name
    return parse_html(path.read_text(encoding="utf-8"))


def load_page_raw(page_name: str) -> str:
    """Load raw HTML string of built root HTML file."""
    if not page_name.endswith(".html"):
        page_name += ".html"
    path = REPO_ROOT / page_name
    return path.read_text(encoding="utf-8")


def load_source_page(page_name: str) -> str:
    """Load template from pages/ directory."""
    if not page_name.endswith(".html"):
        page_name += ".html"
    path = REPO_ROOT / "pages" / page_name
    return path.read_text(encoding="utf-8")


def load_partial(partial_name: str) -> str:
    """Load partial template from partials/ directory."""
    if not partial_name.endswith(".html"):
        partial_name += ".html"
    path = REPO_ROOT / "partials" / partial_name
    return path.read_text(encoding="utf-8")


def load_asset(asset_name: str) -> str:
    """Load asset file content from assets/ directory."""
    path = REPO_ROOT / "assets" / asset_name
    return path.read_text(encoding="utf-8")
