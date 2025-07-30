"""Abstraction layer for Shotgun API or local fake implementation."""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from django.apps import apps


class ShotgunClient:
    """Provide Shotgun-like API backed by real or fake implementation."""

    def __init__(self, base_url: Optional[str] = None, script_name: Optional[str] = None,
                 api_key: Optional[str] = None, use_dummy: bool | None = None) -> None:
        if use_dummy is None:
            use_dummy = os.environ.get("USE_DUMMY_SHOTGUN", "1") == "1"
        if use_dummy:
            # When using the local dummy implementation, ensure the Django
            # application registry is initialised before accessing any models.
            import django
            if not apps.ready:
                django.setup()
            try:
                from dummy_server.fake_shotgun import FakeShotgun
            except ImportError:
                from fake_shotgun import FakeShotgun
            self._impl = FakeShotgun()
        else:
            import shotgun_api3
            self._impl = shotgun_api3.Shotgun(base_url, script_name, api_key)

    def find(self, entity_type: str, filters: Optional[List] = None,
             fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        return self._impl.find(entity_type, filters or [], fields or None)

    def create(self, entity_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._impl.create(entity_type, data)

    def update(self, entity_type: str, entity_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._impl.update(entity_type, entity_id, data)

    def summarize(self, entity_type: str, filters: Optional[List] = None,
                  summary_fields: Optional[List[Dict[str, str]]] = None) -> Any:
        return self._impl.summarize(entity_type, filters or [], summary_fields or [])
