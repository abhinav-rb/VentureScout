"""Security utilities for VentureScout."""

import ipaddress
import os
import re
from enum import Enum
from functools import wraps
from urllib.parse import urlparse

from flask import jsonify, request


# ---------------------------------------------------------------------------
# Deal status enum
# ---------------------------------------------------------------------------
class DealStatus(str, Enum):
    NEW = "New"
    OUTREACH = "Outreach"
    DUE_DILIGENCE = "Due Diligence"
    PASS = "Pass"
    INVEST = "Invest"

    @classmethod
    def values(cls) -> list[str]:
        return [s.value for s in cls]


# ---------------------------------------------------------------------------
# URL validation / SSRF prevention
# ---------------------------------------------------------------------------
_BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / cloud metadata
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

ALLOWED_SCHEMES = {"http", "https"}


def validate_url(url: str) -> tuple[bool, str]:
    """Return (is_valid, error_message) for a user-supplied URL."""
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Malformed URL"

    # Scheme check
    if parsed.scheme not in ALLOWED_SCHEMES:
        return False, f"URL scheme must be http or https, got '{parsed.scheme}'"

    hostname = parsed.hostname
    if not hostname:
        return False, "URL has no hostname"

    # Block obvious internal hostnames
    if hostname in ("localhost", "0.0.0.0"):
        return False, "Internal hostnames are not allowed"

    # Resolve hostname to IP and check against blocked ranges
    try:
        import socket

        addr_info = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addr_info:
            ip = ipaddress.ip_address(sockaddr[0])
            for network in _BLOCKED_IP_RANGES:
                if ip in network:
                    return (
                        False,
                        "URLs pointing to internal/private "
                        "networks are not allowed",
                    )
    except socket.gaierror:
        return False, f"Could not resolve hostname: {hostname}"

    return True, ""


# ---------------------------------------------------------------------------
# API-key authentication
# ---------------------------------------------------------------------------
def require_api_key(f):
    """Decorator that checks for a valid API key in the request header.

    Set the expected key via the VS_API_KEY environment variable.
    When VS_API_KEY is unset, authentication is **disabled** (dev mode).
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        expected_key = os.getenv("VS_API_KEY")
        if not expected_key:
            # Auth not configured – allow (development mode)
            return f(*args, **kwargs)

        provided_key = request.headers.get("X-API-Key", "")
        if not provided_key or provided_key != expected_key:
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        return f(*args, **kwargs)

    return decorated


# ---------------------------------------------------------------------------
# Prompt-injection sanitiser
# ---------------------------------------------------------------------------
_INSTRUCTION_PATTERNS = re.compile(
    r"(ignore previous instructions|you are now|system prompt|"
    r"disregard all|override instructions|act as|pretend you)",
    re.IGNORECASE,
)


def sanitize_for_llm(text: str, max_length: int = 5000) -> str:
    """Basic sanitisation of user-sourced text before sending to an LLM.

    - Truncates to *max_length* characters.
    - Strips characters that serve no useful purpose in scraped text.
    - Flags / redacts common prompt-injection phrases.
    """
    text = text[:max_length]
    # Collapse excessive whitespace
    text = re.sub(r"\s{3,}", "  ", text)
    # Redact obvious injection attempts
    text = _INSTRUCTION_PATTERNS.sub("[REDACTED]", text)
    return text
