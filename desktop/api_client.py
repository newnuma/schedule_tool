"""Abstraction for accessing Flow-PT like entities.

In development mode this uses :class:`dummy_server.fake_shotgun.FakeShotgun`.
When ``USE_DUMMY_SHOTGUN`` is unset it falls back to ``shotgun_api3.Shotgun``.
The exported helper functions keep the old interface used by the Qt bridge
layer so the frontend does not need to change.
"""

from typing import Any, List, Optional, Tuple
from decimal import Decimal

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
sys.path.append(os.path.join(BASE_DIR, "dummy_server"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dummy_server.settings')

# import django
# django.setup()

from shotgun_wrapper import ShotgunClient


sg = ShotgunClient()



import datetime

# 共通整形関数
def _format_value(value):
    # Decimal を数値(float)へ変換（フロントで扱いやすくするため）
    if isinstance(value, Decimal):
        return float(value)
    # datetime.datetime または datetime.date を文字列に変換
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.strftime('%Y-%m-%d')
    
    # Django model オブジェクト（外部キー）の場合
    if hasattr(value, '_meta') and hasattr(value, 'id') and hasattr(value, 'name'):
        model_name = value._meta.model_name.lower()
        return {
            'type': model_name,
            'id': value.id,
            'name': str(value)  # __str__ メソッドでProject Alphaのような文字列を取得
        }
    
    # 辞書形式の外部キー
    if isinstance(value, dict) and 'id' in value and 'name' in value:
        return {'id': value['id'], 'name': value['name']}
    
    return value

def _format_dict(d):
    if not isinstance(d, dict):
        return _format_value(d)
    result = {}
    for k, v in d.items():
        if isinstance(v, list):
            result[k] = [_format_dict(i) if isinstance(i, dict) else _format_value(i) for i in v]
        elif isinstance(v, dict):
            # 外部キーはid,nameのみ抽出
            if 'id' in v and 'name' in v and len(v) <= 3:
                result[k] = {'id': v['id'], 'name': v['name']}
            else:
                result[k] = _format_dict(v)
        else:
            result[k] = _format_value(v)
    return result

def _format_list(lst):
    return [_format_dict(item) if isinstance(item, dict) else _format_value(item) for item in lst]

def get_entities(entity: str, filters: Optional[List] = None, fields: Optional[List[str]] = None) -> Any:
    data = sg.find(entity, filters or [], fields)
    return _format_list(data)

def get_entity(entity: str, entity_id: int, fields: Optional[List[str]] = None) -> Any:
    filters = [["id", "is", entity_id]]
    data = sg.find_one(entity, filters, fields)
    return _format_dict(data) if data else data

def fetch_distribute_page() -> Any:
    """Distributeページ用: すべてのSubprojectとPhaseを取得"""
    subprojects = get_entities("Subproject")
    phases = get_entities("Phase")
    return {
        "subprojects": subprojects,
        "phases": phases,
    }


def fetch_steps() -> Any:
    return get_entities("Step")


# 指定したIDのプロジェクトに関連する情報を取得
def fetch_project_page(project_id: int) -> Any:
    # Subproject（プロジェクト）取得
    subproject = get_entity("Subproject", project_id)
    if not subproject:
        return {
            "phases": [],
            "assets": [],
            "tasks": [],
            "personworkloads": [],
            "pmmworkloads": [],
        }

    # Phase取得（親: Subproject）
    phases = get_entities("Phase", [["subproject", "is", subproject["id"]]])

    # Asset取得（親: Phase）
    phase_ids = [phase["id"] for phase in phases]
    assets = get_entities("Asset", [["phase", "in", phase_ids]]) if phase_ids else []

    # Task取得（親: Asset）
    asset_ids = [asset["id"] for asset in assets]
    tasks = get_entities("Task", [["asset", "in", asset_ids]]) if asset_ids else []

    # PersonWorkload取得（親: Task）
    task_ids = [task["id"] for task in tasks]
    personworkloads = get_entities("PersonWorkload", [["task", "in", task_ids]]) if task_ids else []

    # PMMWorkload取得（親: Subproject）
    pmmworkloads = get_entities("PMMWorkload", [["subproject", "is", subproject["id"]]]) if subproject else []

    return {
        "phases": phases,
        "assets": assets,
        "tasks": tasks,
        "personworkloads": personworkloads,
        "pmmworkloads": pmmworkloads,
    }

# メンバーリストにあるpersonに関連する情報を取得
def _parse_iso_date(s: str) -> datetime.date:
    return datetime.date.fromisoformat(s)

def _overlaps(a_start: datetime.date, a_end: datetime.date, b_start: datetime.date, b_end: datetime.date) -> bool:
    return a_start <= b_end and a_end >= b_start

def fetch_assignment_page(start_iso: str, end_iso: str) -> Any:
    """Assignmentページ用: 指定期間に存在するTask, PersonWorkload と全Person"""
    start = _parse_iso_date(start_iso)
    end = _parse_iso_date(end_iso)

    # 生データ取得（未整形）
    tasks_raw = sg.find("Task", [], None)
    pw_raw = sg.find("PersonWorkload", [], None)

    # 期間に重なるTask
    tasks_filtered = [t for t in tasks_raw if _overlaps(t["start_date"], t["end_date"], start, end)]

    # 期間内のPersonWorkload（週が範囲内）
    pw_filtered = [w for w in pw_raw if start <= w["week"] <= end]

    # 整形
    tasks = _format_list(tasks_filtered)
    personworkloads = _format_list(pw_filtered)
    person = get_entities("Person")

    return {
        "tasks": tasks,
        "personworkloads": personworkloads,
        "person": person,
    }

def fetch_assignment_tasks(start_iso: str, end_iso: str) -> Any:
    """期間に重なるTaskのみを返す（大量データ読み込みを避けるためフィルタして取得）"""
    start = _parse_iso_date(start_iso)
    end = _parse_iso_date(end_iso)
    # DB側でフィルター（start_date <= end かつ end_date >= start）
    tasks = get_entities(
        "Task",
        [["start_date", "<=", end], ["end_date", ">=", start]],
    )
    # subprojectをドットキーで付与（task -> asset -> phase -> subproject）
    try:
        asset_ids = list({t.get("asset", {}).get("id") for t in tasks if t.get("asset")})
        assets = get_entities("Asset", [["id", "in", asset_ids]], ["id", "phase"]) if asset_ids else []
        phase_ids = list({a.get("phase", {}).get("id") for a in assets if a.get("phase")})
        phases = get_entities("Phase", [["id", "in", phase_ids]], ["id", "subproject"]) if phase_ids else []

        asset_to_phase = {a["id"]: (a.get("phase") or {}).get("id") for a in assets}
        phase_to_sp = {p["id"]: p.get("subproject") for p in phases}

        for t in tasks:
            aid = (t.get("asset") or {}).get("id")
            pid = asset_to_phase.get(aid)
            sp = phase_to_sp.get(pid)
            if sp and isinstance(sp, dict) and "id" in sp:
                # ドットキーで付与
                t["asset.phase.subproject"] = {
                    "type": "subproject",
                    "id": sp.get("id"),
                    "name": sp.get("name", ""),
                }
    except Exception:
        # フォールバック（埋め込みなしでも返却）
        pass
    return {"tasks": tasks}

def fetch_assignment_workloads(start_iso: str, end_iso: str) -> Any:
    """期間内のPersonWorkloadのみを返す（週=weekが範囲内）"""
    start = _parse_iso_date(start_iso)
    end = _parse_iso_date(end_iso)
    personworkloads = get_entities(
        "PersonWorkload",
        [["week", ">=", start], ["week", "<=", end]],
    )
    # subprojectをドットキーで付与（workload -> task -> asset -> phase -> subproject）
    try:
        task_ids = list({w.get("task", {}).get("id") for w in personworkloads if w.get("task")})
        tasks_min = get_entities("Task", [["id", "in", task_ids]], ["id", "asset"]) if task_ids else []
        asset_ids = list({t.get("asset", {}).get("id") for t in tasks_min if t.get("asset")})
        assets = get_entities("Asset", [["id", "in", asset_ids]], ["id", "phase"]) if asset_ids else []
        phase_ids = list({a.get("phase", {}).get("id") for a in assets if a.get("phase")})
        phases = get_entities("Phase", [["id", "in", phase_ids]], ["id", "subproject"]) if phase_ids else []

        task_to_asset = {t["id"]: (t.get("asset") or {}).get("id") for t in tasks_min}
        asset_to_phase = {a["id"]: (a.get("phase") or {}).get("id") for a in assets}
        phase_to_sp = {p["id"]: p.get("subproject") for p in phases}

        for w in personworkloads:
            tid = (w.get("task") or {}).get("id")
            aid = task_to_asset.get(tid)
            pid = asset_to_phase.get(aid)
            sp = phase_to_sp.get(pid)
            if sp and isinstance(sp, dict) and "id" in sp:
                w["task.asset.phase.subproject"] = {
                    "type": "subproject",
                    "id": sp.get("id"),
                    "name": sp.get("name", ""),
                }
    except Exception:
        pass
    return {"personworkloads": personworkloads}

def init_load(project_id: int, person_list: List[int], assignment_range: Tuple[str, str]) -> Any:
    """起動時ロード: 3ページの必要情報 + 基本情報(Step) を一括取得し、ID重複なしでマージして返す"""
    distribute = fetch_distribute_page()
    project_page = fetch_project_page(project_id)
    assignment_page = fetch_assignment_page(assignment_range[0], assignment_range[1])

    steps = fetch_steps()

    def merge_by_id(*lists, id_key="id"):
        merged = {}
        for lst in lists:
            for item in lst or []:
                merged[item[id_key]] = item
        return list(merged.values())

    return {
        "steps": steps,
        "subprojects": merge_by_id(distribute.get("subprojects", [])),
        "phases": merge_by_id(distribute.get("phases", []), project_page.get("phases", [])),
        "assets": merge_by_id(project_page.get("assets", [])),
        "tasks": merge_by_id(project_page.get("tasks", []), assignment_page.get("tasks", [])),
        "personworkloads": merge_by_id(project_page.get("personworkloads", []), assignment_page.get("personworkloads", [])),
        "pmmworkloads": merge_by_id(project_page.get("pmmworkloads", [])),
        "person": merge_by_id(assignment_page.get("person", [])),
        "selectedSubprojectId": project_id,
        "selectedPersonList": person_list,
    }


# def get_assets() -> Any:
#     return _find("Asset")


# def get_asset(asset_id: int) -> Any:
#     return _find("Asset", [["id", "is", asset_id]])[0]


# def get_tasks() -> Any:
#     return _find("Task")


# def get_task(task_id: int) -> Any:
#     return _find("Task", [["id", "is", task_id]])[0]


# def get_workloads() -> Any:
#     return _find("Workload")


# def get_workload(workload_id: int) -> Any:
#     return _find("Workload", [["id", "is", workload_id]])[0]


# def get_people() -> Any:
#     return _find("Person")


# def get_person(person_id: int) -> Any:
#     return _find("Person", [["id", "is", person_id]])[0]


# def get_workcategories() -> Any:
#     return _find("WorkCategory")


# def get_workcategory(category_id: int) -> Any:
#     return _find("WorkCategory", [["id", "is", category_id]])[0]

