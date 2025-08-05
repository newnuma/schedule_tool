"""Fake Shotgun API using Django ORM models."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from django.apps import apps
from django.db.models import Count, Sum


class FakeShotgun:
    """Simplified Shotgun API backed by local models."""

    def __init__(self) -> None:
        # Defer model lookup until Django has been fully initialised.
        # ``_model_map`` will be populated on first access via ``_ensure_models``.
        self._model_map = None

    def _ensure_models(self) -> None:
        """Populate model mapping lazily after ``django.setup``."""
        if self._model_map is None:
            self._model_map = {
                "Person": apps.get_model("api", "Person"),
                "Subproject": apps.get_model("api", "Subproject"),
                "Phase": apps.get_model("api", "Phase"),
                "Asset": apps.get_model("api", "Asset"),
                "Task": apps.get_model("api", "Task"),
                "Workload": apps.get_model("api", "Workload"),
                "WorkCategory": apps.get_model("api", "WorkCategory"),
            }

    # utility
    def _model(self, entity_type: str):
        self._ensure_models()
        model = self._model_map.get(entity_type)
        if not model:
            raise ValueError(f"Unknown entity type: {entity_type}")
        return model

    def _serialize(self, obj: Any, fields: Optional[List[str]] = None) -> Dict[str, Any]:
        if fields:
            result = {}
            for f in fields:
                if hasattr(obj, f):
                    attr = getattr(obj, f)
                    # ManyToManyFieldの場合はクエリセットからリストに変換
                    if hasattr(attr, 'all'):
                        result[f] = list(attr.all())
                    else:
                        result[f] = attr
                else:
                    result[f] = None
            return result
        
        # 通常のフィールドとManyToManyフィールドの両方を取得
        result = {}
        
        # 通常のフィールド
        for field in obj._meta.fields:
            result[field.name] = getattr(obj, field.name)
        
        # ManyToManyフィールド
        for field in obj._meta.many_to_many:
            manager = getattr(obj, field.name)
            result[field.name] = list(manager.all())
        
        return result

    def _apply_filters(self, qs, filters: List) :
        for filt in filters:
            if len(filt) == 3:
                field, op, value = filt
            else:
                field, value = filt
                op = "is"
            if op in ("is", "equals", "=="):
                qs = qs.filter(**{field: value})
            elif op == "in":
                qs = qs.filter(**{f"{field}__in": value})
            else:
                raise NotImplementedError(f"Operator {op} not supported")
        return qs

    # API methods
    def find(self, entity_type: str, filters: Optional[List] = None,
             fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        Model = self._model(entity_type)
        qs = Model.objects.all()
        if filters:
            qs = self._apply_filters(qs, filters)
        return [self._serialize(obj, fields) for obj in qs]

    def create(self, entity_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        Model = self._model(entity_type)
        obj = Model.objects.create(**data)
        return self._serialize(obj)

    def update(self, entity_type: str, entity_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        Model = self._model(entity_type)
        Model.objects.filter(id=entity_id).update(**data)
        obj = Model.objects.get(id=entity_id)
        return self._serialize(obj)

    def summarize(self, entity_type: str, filters: Optional[List] = None,
                  summary_fields: Optional[List[Dict[str, str]]] = None) -> Any:
        Model = self._model(entity_type)
        qs = Model.objects.all()
        if filters:
            qs = self._apply_filters(qs, filters)
        summary_fields = summary_fields or []
        results = {}
        for field in summary_fields:
            column = field.get("column")
            op = field.get("type", "count")
            if op == "count":
                results[column] = qs.aggregate(v=Count(column))["v"]
            elif op == "sum":
                results[column] = qs.aggregate(v=Sum(column))["v"]
        return results
