"""Geocoding service - complete partial addresses (Québec) via Nominatim."""

import asyncio
import re
from typing import Optional, List, Dict, Any, Tuple

try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False
    Nominatim = None

def _normalize_address(addr: str) -> str:
    """Expand common abbreviations for better geocoding."""
    if not addr or not addr.strip():
        return addr
    t = addr.strip()
    for pattern, repl in [
        (r"\bBd\b", "Boulevard"),
        (r"\bAv\.?\b", "Avenue"),
        (r"\bAve\.?\b", "Avenue"),
        (r"\bCh\.?\b", "Chemin"),
        (r"\bRte\b", "Route"),
    ]:
        t = re.sub(pattern, repl, t, flags=re.I)
    return t


def _format_postal_code(pc: str) -> str:
    """Format Canadian postal code as A1A 1A1."""
    if not pc:
        return ""
    s = re.sub(r"\s+", "", str(pc).strip().upper())
    if len(s) == 6 and s[0].isalpha() and s[1].isdigit() and s[2].isalpha():
        return f"{s[0]}{s[1]}{s[2]} {s[3]}{s[4]}{s[5]}"
    return str(pc).strip()


def _loc_to_full_address(loc: Any) -> Tuple[str, str]:
    """From geopy Location, return (full_address, city)."""
    raw = getattr(loc, "raw", None) or {}
    adr = raw.get("address", {}) if isinstance(raw, dict) else {}
    if not isinstance(adr, dict):
        return (loc.address or "", "")
    house = adr.get("house_number") or adr.get("house") or ""
    road = adr.get("road") or adr.get("street") or ""
    street_part = f"{house} {road}".strip() or (loc.address or "").split(",")[0]
    city = (
        adr.get("city") or adr.get("town") or
        adr.get("village") or adr.get("municipality") or ""
    )
    state = str(adr.get("state") or adr.get("province") or "")
    postcode = _format_postal_code(adr.get("postcode") or adr.get("postal_code") or "")
    parts = []
    if street_part:
        parts.append(street_part)
    if city:
        parts.append(city)
    if state:
        parts.append(state[:2].upper() if len(state) > 2 else state)
    if postcode:
        parts.append(postcode)
    return (", ".join(parts) if parts else loc.address or "", city or "")


def _geocode_candidates_sync(addr: str) -> List[Dict[str, str]]:
    """
    Geocode and return candidates. One query: address as given, or "addr, Québec, Canada"
    if no city. No pre-defined street list — search the exact address.
    """
    if not GEOPY_AVAILABLE or not Nominatim or not addr or len(addr.strip()) < 5:
        return []
    addr_clean = _normalize_address(addr.strip())
    has_city = "," in addr_clean and len(addr_clean.split(",")) >= 2
    seen = set()
    candidates: List[Dict[str, str]] = []

    def _add(loc_list: list) -> None:
        for loc in loc_list or []:
            raw = getattr(loc, "raw", None) or {}
            adr = raw.get("address", {}) if isinstance(raw, dict) else {}
            if adr.get("country_code", "").upper() != "CA":
                continue
            full, city = _loc_to_full_address(loc)
            key = full.lower().strip()
            if key and key not in seen:
                seen.add(key)
                candidates.append({"full_address": full, "city": city})

    try:
        geolocator = Nominatim(user_agent="Lea-API-Courtier/1.0", timeout=10)
        q = addr_clean if has_city else f"{addr_clean}, Québec, Canada"
        locs = geolocator.geocode(q, addressdetails=True, exactly_one=False)
        _add(locs if isinstance(locs, list) else [locs])
        candidates = list({c["full_address"]: c for c in candidates}.values())
    except (GeocoderTimedOut, GeocoderServiceError, Exception):
        pass

    return candidates[:5]


async def geocode_address_candidates(partial_address: str) -> List[Dict[str, str]]:
    """
    Async. Returns list of {"full_address", "city"} candidates.
    Prioritizes Montréal for Québec addresses without city.
    """
    if not partial_address or len(partial_address.strip()) < 5:
        return []
    try:
        return await asyncio.to_thread(_geocode_candidates_sync, partial_address)
    except Exception:
        return []


async def geocode_address(partial_address: str) -> Optional[str]:
    """
    Async geocode. Returns first candidate's full address or None.
    Kept for backward compatibility.
    """
    candidates = await geocode_address_candidates(partial_address)
    return candidates[0]["full_address"] if candidates else None


def looks_partial(addr: str) -> bool:
    """True if address seems incomplete (no postal code, possibly no city)."""
    if not addr or len(addr.strip()) < 5:
        return False
    # Canadian postal code pattern A1A 1A1
    if re.search(r"[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d", addr):
        return False
    return True
