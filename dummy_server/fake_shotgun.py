"""Fake Shotgun API using Django ORM models.

Enhancements:
- fields selection with dotted path traversal (e.g., "asset.phase.subproject").
- link fields serialized to ShotGrid-like link dicts: {"type","id","name"}.
- ManyToMany fields serialized as arrays of link dicts.
- date/datetime values serialized as "YYYY-MM-DD" strings.
- filters support dotted paths and common ShotGrid operators (is, is_not, in, not_in,
  contains, not_contains, starts_with, ends_with, <, <=, >, >=, between/range) with
  AND/OR grouping via filter_operator.
- optional ordering and pagination parameters.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from django.apps import apps
from django.db.models import Count, Sum, Q
import datetime
from decimal import Decimal


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
                "MilestoneTask": apps.get_model("api", "MilestoneTask"),
                "PersonWorkload": apps.get_model("api", "PersonWorkload"),
                "PMMWorkload": apps.get_model("api", "PMMWorkload"),
                "WorkCategory": apps.get_model("api", "WorkCategory"),
                "Step": apps.get_model("api", "Step"),
            }

    # utility
    def _model(self, entity_type: str):
        self._ensure_models()
        model = self._model_map.get(entity_type)
        if not model:
            raise ValueError(f"Unknown entity type: {entity_type}")
        return model

    # ----------------------
    # Serialization helpers
    # ----------------------
    def _format_value(self, value: Any) -> Any:
        """Format a scalar value to be ShotGrid-like and frontend-friendly.

        - Decimal -> float
        - date/datetime -> 'YYYY-MM-DD'
        - Django model instance -> link dict {type,id,name}
        - ManyRelatedManager/QuerySet -> list of link dicts
        """
        # ManyToMany manager or queryset
        if hasattr(value, "all") and callable(getattr(value, "all")):
            return [self._to_link(v) for v in value.all()]
        # Model instance
        if hasattr(value, "_meta") and hasattr(value, "id"):
            return self._to_link(value)
        # Decimal
        if isinstance(value, Decimal):
            return float(value)
        # date/datetime
        if isinstance(value, (datetime.date, datetime.datetime)):
            return value.strftime("%Y-%m-%d")
        return value

    def _to_link(self, obj: Any) -> Dict[str, Any]:
        type_name = obj.__class__.__name__
        name = None
        # Prefer explicit 'name' attr, fallback to __str__
        if hasattr(obj, "name"):
            try:
                name = getattr(obj, "name")
            except Exception:
                name = None
        if not name:
            try:
                name = str(obj)
            except Exception:
                name = ""
        return {"type": type_name, "id": obj.id, "name": name}

    def _resolve_dotted(self, obj: Any, dotted_field: str) -> Any:
        """Resolve a dotted path field from an object.

        Returns a Django model instance, list of instances, scalar, or None.
        """
        current = obj
        for i, part in enumerate(dotted_field.split(".")):
            if current is None:
                return None
            # ManyToMany traversal only supported at final segment
            if hasattr(current, part):
                current = getattr(current, part)
                # If we are not at last token and hit a ManyToMany manager, bail
                if i < len(dotted_field.split(".")) - 1 and hasattr(current, "all") and callable(getattr(current, "all")):
                    # Can't traverse beyond M2M in dotted paths safely
                    return None
            else:
                return None
        return current

    def _serialize(self, obj: Any, fields: Optional[List[str]] = None) -> Dict[str, Any]:
        result: Dict[str, Any] = {}
        # Always include id and type to be ShotGrid-like
        result["id"] = getattr(obj, "id", None)
        result["type"] = obj.__class__.__name__

        if fields:
            for f in fields:
                # dotted path field (flattened into key with dots to match caller expectations)
                if "." in f:
                    val = self._resolve_dotted(obj, f)
                    result[f] = self._format_value(val) if val is not None else None
                else:
                    if hasattr(obj, f):
                        val = getattr(obj, f)
                        result[f] = self._format_value(val)
                    else:
                        # unknown field returns None for compatibility
                        result[f] = None
            return result

        # No fields requested: serialize all fields and many-to-many
        for field in obj._meta.fields:
            fname = field.name
            result[fname] = self._format_value(getattr(obj, fname))
        for field in obj._meta.many_to_many:
            fname = field.name
            manager = getattr(obj, fname)
            result[fname] = [self._to_link(v) for v in manager.all()]
        return result

    # ----------------------
    # Filtering helpers
    # ----------------------
    def _normalize_field_lookup(self, field: str, op: str, value: Any) -> Tuple[str, Any, bool]:
        """Convert dotted field and operator to Django ORM lookup and normalized value.

        Returns (lookup, value, is_exclude)
        """
        is_exclude = False
        # dotted path -> Django lookup
        base = field.replace(".", "__")

        # Normalize link value dict -> id
        def norm_val(v: Any) -> Any:
            if hasattr(v, "_meta") and hasattr(v, "id"):
                return v.id
            if isinstance(v, dict) and "id" in v:
                return v.get("id")
            return v

        # Bulk normalize for sequences
        def norm_seq(seq: Sequence[Any]) -> List[Any]:
            return [norm_val(x) for x in seq]

        op = op or "is"
        op = op.lower()
        if op in ("is", "equals", "=="):
            # If value is None, use isnull
            if value is None:
                return (f"{base}__isnull", True, False)
            # If comparing link, use id field
            return (f"{base}__id" if isinstance(value, (dict,)) or hasattr(value, "_meta") else base, norm_val(value), False)
        if op in ("is_not", "!="):
            if value is None:
                return (f"{base}__isnull", False, False)  # will be combined as exclude later
            lookup = f"{base}__id" if isinstance(value, (dict,)) or hasattr(value, "_meta") else base
            return (lookup, norm_val(value), True)
        if op == "in":
            return (f"{base}__in", norm_seq(value), False)
        if op == "not_in":
            return (f"{base}__in", norm_seq(value), True)
        if op in ("contains", "name_contains"):
            return (f"{base}__icontains", value, False)
        if op == "not_contains":
            return (f"{base}__icontains", value, True)
        if op in ("starts_with", "startswith"):
            return (f"{base}__istartswith", value, False)
        if op in ("ends_with", "endswith"):
            return (f"{base}__iendswith", value, False)
        if op in (">=", "gte"):
            return (f"{base}__gte", value, False)
        if op in ("<=", "lte"):
            return (f"{base}__lte", value, False)
        if op in (">", "gt"):
            return (f"{base}__gt", value, False)
        if op in ("<", "lt"):
            return (f"{base}__lt", value, False)
        if op in ("range", "between"):
            # value should be (start, end)
            return (f"{base}__range", value, False)
        raise NotImplementedError(f"Operator {op} not supported")

    def _build_q_from_filters(self, filters: List, filter_operator: str = "all") -> Q:
        """Build a Django Q object from ShotGrid-like filter list with grouping support."""
        if not filters:
            return Q()
        connector = Q.AND if (filter_operator or "all").lower() == "all" else Q.OR
        q = Q()
        for item in filters:
            if isinstance(item, dict) and "filter_operator" in item:
                subop = item.get("filter_operator", "all")
                subfilters = item.get("filters", [])
                q_child = self._build_q_from_filters(subfilters, subop)
                q.add(q_child, connector)
                continue
            # tuple/list condition
            if len(item) == 3:
                field, op, value = item
            elif len(item) == 2:
                field, value = item
                op = "is"
            else:
                raise ValueError(f"Invalid filter element: {item}")
            lookup, norm_value, is_exclude = self._normalize_field_lookup(field, op, value)
            cond_q = Q(**{lookup: norm_value})
            if is_exclude:
                cond_q = ~cond_q
            q.add(cond_q, connector)
        return q

    def _apply_filters(self, qs, filters: List, filter_operator: str = "all"):
        if not filters:
            return qs
        q = self._build_q_from_filters(filters, filter_operator)
        return qs.filter(q)

    # API methods
    def find(
        self,
        entity_type: str,
        filters: Optional[List] = None,
        fields: Optional[List[str]] = None,
        order: Optional[List[Dict[str, str]]] = None,
        filter_operator: str = "all",
        limit: int = 0,
        page: int = 0,
        project: Optional[Union[int, Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        Model = self._model(entity_type)
        qs = Model.objects.all()
        if filters:
            qs = self._apply_filters(qs, filters, filter_operator)
        # ordering
        if order:
            ordering: List[str] = []
            for spec in order:
                if isinstance(spec, dict):
                    fname = spec.get("field_name") or spec.get("field") or spec.get("name")
                    direction = (spec.get("direction") or "asc").lower()
                else:
                    # accept simple string like 'code' or '-code'
                    fname = str(spec)
                    direction = "asc"
                if not fname:
                    continue
                # dotted -> __ lookup for ordering
                orm_field = fname.replace(".", "__")
                if direction.startswith("desc") or fname.startswith("-"):
                    if not fname.startswith("-"):
                        orm_field = f"-{orm_field}"
                ordering.append(orm_field)
            if ordering:
                qs = qs.order_by(*ordering)
        # pagination
        if limit and limit > 0:
            if page and page > 0:
                offset = (page - 1) * limit
                qs = qs[offset : offset + limit]
            else:
                qs = qs[:limit]
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
