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
        return {'id': value['id'], 'name': value['name'], 'type': model_name}
    
    return value

def _format_dict(d):
    if not isinstance(d, dict):
        return _format_value(d)
    result = {}
    for k, v in d.items():
        if isinstance(v, list):
            result[k] = [_format_dict(i) if isinstance(i, dict) else _format_value(i) for i in v]
        elif isinstance(v, dict):
            # 外部キーはid,name,typeを抽出
            if 'id' in v and 'name' in v:
                # typeがなければ推測
                type_val = v.get('type')
                if not type_val:
                    # Django model instanceの場合
                    if hasattr(v, '_meta'):
                        type_val = v['_meta'].model_name.capitalize()
                    else:
                        type_val = None
                fk = {'id': v['id'], 'name': v['name']}
                if type_val:
                    fk['type'] = type_val
                result[k] = fk
            else:
                result[k] = _format_dict(v)
        else:
            result[k] = _format_value(v)
    return result

def _format_list(lst):
    return [_format_dict(item) if isinstance(item, dict) else _format_value(item) for item in lst]

def remap_key_in_list(
    items: List[dict],
    old_key: str,
    new_key: str,
    *,
    remove_old: bool = True,
    override: bool = False,
    copy_items: bool = True,
) -> List[dict]:
    """配列内の辞書に対してキー名を置き換えるユーティリティ。

    Args:
        items: 辞書型が含まれる配列（Task, PersonWorkloadなど）
        old_key: 現状のキー名（例: "asset.phase.subproject"）
        new_key: 新しいキー名（例: "subproject"）
        remove_old: 置き換え後に旧キーを削除するかどうか（デフォルト: True）
        override: new_key が既に存在する場合に上書きするか（デフォルト: False）
        copy_items: 各要素の辞書をコピーして非破壊で返すか（デフォルト: True）

    Returns:
        キーを置き換えた新しい配列（copy_items=True の場合）。
        copy_items=False の場合は入力の辞書を直接変更し、その同じ参照を返す。
    """
    result: List[dict] = []
    for it in items or []:
        if not isinstance(it, dict):
            result.append(it)
            continue
        target = it.copy() if copy_items else it
        if old_key in target:
            if override or new_key not in target:
                target[new_key] = target[old_key]
            if remove_old:
                try:
                    del target[old_key]
                except KeyError:
                    pass
        result.append(target)
    return result

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


def fetch_basic_data() -> Any:
    person = get_entities("Person")
    steps = get_entities("Step")
    work_categories = get_entities("WorkCategory")
    return {
        "person": person,
        "steps": steps,
        "workCategories": work_categories,
    }


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
    asset_fields = [
        "id",
        "name",
        "phase",
        "start_date",
        "end_date",
        "asset_type",
        "work_category",
        "step",
        "step.color",
    ]
    assets = get_entities("Asset", [["phase", "in", phase_ids]], asset_fields) if phase_ids else []
    assets = remap_key_in_list(assets, "step.color", "color")

    # Task取得（親: Asset）
    asset_ids = [asset["id"] for asset in assets]
    task_fields = [
        "id",
        "name",
        "asset",
        "start_date",
        "end_date",
        "status",
        "assignees",
        "asset.phase.subproject",
        "asset.work_category",
    ]
    tasks = get_entities("Task", [["asset", "in", asset_ids]], task_fields) if asset_ids else []
    # サブプロジェクトを統一キーに
    tasks = remap_key_in_list(tasks, "asset.phase.subproject", "subproject")
    tasks = remap_key_in_list(tasks, "asset.work_category", "work_category")

    # MilestoneTask取得（親: Asset、同一サブプロジェクトに属するもののみ）
    ms_fields = [
        "id",
        "name",
        "asset",
        "start_date",
        "end_date",
        "milestone_type",
        "asset.phase.subproject",
        "asset.type"
    ]
    milestone_tasks = get_entities("MilestoneTask", [["asset", "in", asset_ids]], ms_fields) if asset_ids else []
    milestone_tasks = remap_key_in_list(milestone_tasks, "asset.phase.subproject", "subproject")
    milestone_tasks = remap_key_in_list(milestone_tasks, "asset.type", "asset_type")
    milestone_tasks = [m for m in milestone_tasks if m.get("subproject", {}).get("id") == subproject["id"]]

    # PersonWorkload取得（親: Task）
    task_ids = [task["id"] for task in tasks]
    pw_fields = [
        "id",
        "name",
        "task",
        "person",
        "week",
        "man_week",
        "task.asset.phase.subproject",
    ]
    personworkloads = get_entities("PersonWorkload", [["task", "in", task_ids]], pw_fields) if task_ids else []
    personworkloads = remap_key_in_list(personworkloads, "task.asset.phase.subproject", "subproject")

    # PMMWorkload取得（親: Subproject）
    pmmworkloads = get_entities("PMMWorkload", [["subproject", "is", subproject["id"]]]) if subproject else []

    return {
        "phases": phases,
        "assets": assets,
        "tasks": tasks,
        "personworkloads": personworkloads,
    "pmmworkloads": pmmworkloads,
    "milestoneTasks": milestone_tasks,
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

    # DB側でフィルタして取得
    task_fields = [
        "id",
        "name",
        "asset",
        "start_date",
        "end_date",
        "status",
        "assignees",
        "asset.phase.subproject",
    ]
    tasks = get_entities(
        "Task",
        [["start_date", "<=", start], ["end_date", ">=", end]],
        task_fields,
    )
    tasks = remap_key_in_list(tasks, "asset.phase.subproject", "subproject")

    pw_fields = [
        "id",
        "name",
        "task",
        "person",
        "week",
        "man_week",
        "task.asset.phase.subproject",
    ]
    personworkloads = get_entities(
        "PersonWorkload",
        [["week", ">=", start], ["week", "<=", end]],
        pw_fields,
    )
    personworkloads = remap_key_in_list(personworkloads, "task.asset.phase.subproject", "subproject")

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
    task_fields = [
        "id",
        "name",
        "asset",
        "start_date",
        "end_date",
        "status",
        "assignees",
        "asset.phase.subproject",
    ]
    tasks = get_entities(
        "Task",
        [["start_date", "<=", end], ["end_date", ">=", start]],
        task_fields,
    )
    tasks = remap_key_in_list(tasks, "asset.phase.subproject", "subproject")
    return {"tasks": tasks}

def fetch_assignment_workloads(start_iso: str, end_iso: str) -> Any:
    """期間内のPersonWorkloadのみを返す（週=weekが範囲内）"""
    start = _parse_iso_date(start_iso)
    end = _parse_iso_date(end_iso)
    pw_fields = [
        "id",
        "name",
        "task",
        "person",
        "week",
        "man_week",
        "task.asset.phase.subproject",
    ]
    personworkloads = get_entities(
        "PersonWorkload",
        [["week", ">=", start], ["week", "<=", end]],
        pw_fields,
    )
    personworkloads = remap_key_in_list(personworkloads, "task.asset.phase.subproject", "subproject")
    return {"personworkloads": personworkloads}

def init_load(project_id: int, person_list: List[int], assignment_range: Tuple[str, str]) -> Any:
    """起動時ロード: 3ページの必要情報 + 基本情報(Step) を一括取得し、ID重複なしでマージして返す"""
    distribute = fetch_distribute_page()
    # project_page = fetch_project_page(project_id)
    # assignment_page = fetch_assignment_page(assignment_range[0], assignment_range[1])

    basic_data = fetch_basic_data()

    def merge_by_id(*lists, id_key="id"):
        merged = {}
        for lst in lists:
            for item in lst or []:
                merged[item[id_key]] = item
        return list(merged.values())

    res = {
        "steps": merge_by_id(basic_data.get("steps", [])),
        "subprojects": merge_by_id(distribute.get("subprojects", [])),
        "phases": merge_by_id(distribute.get("phases", [])),
        "person": merge_by_id(basic_data.get("person", [])),
        "workCategories": merge_by_id(basic_data.get("workCategories", [])),
        "selectedSubprojectId": project_id,
        "selectedPersonList": person_list,
    }

    return res


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

