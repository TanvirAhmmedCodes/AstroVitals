"""Data acquisition package for AstroVitals.
Implements the safe Live -> Cache -> Committed Fixture fallback hierarchy.
"""
from src.acquire.safe import fetch_json

__all__ = ["fetch_json"]
