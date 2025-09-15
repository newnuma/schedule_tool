
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

entity_fields = {
    "Department": ["id", "name", "description"],
    "Step": ["id", "name", "color"],
    "Person": ["id", "name", "email", "department", "manager", "subproject"],
    "Subproject": [
        "id", "name", "start_date", "end_date", "editing", "department", "access", "pmm_status","last_edit"
    ],
    "Phase": [
        "id", "subproject", "name", "start_date", "end_date", "milestone", "phase_type"
    ],
    "Asset": [
        "id", "phase", "name", "start_date", "end_date", "asset_type", "work_category", "step", "step.color"
    ],
    "Task": [
        "id", "asset", "name", "start_date", "end_date", "assignees", "status",
        "asset.phase.subproject", "asset.work_category"
    ],
    "MilestoneTask": [
        "id", "asset", "name", "start_date", "end_date", "milestone_type",
        "asset.phase.subproject", "asset.type"
    ],
    "PersonWorkload": [
        "id", "task", "person", "name", "week", "man_week", "task.asset.phase.subproject"
    ],
    "PMMWorkload": [
        "id", "subproject", "work_category", "name", "week", "man_week",
    ],
    "WorkCategory": ["id", "name", "description"],
}

def get_entities(entity: str, filters: Optional[List] = None) -> Any:
    field_list = entity_fields.get(entity)
    data = sg.find(entity, filters or [], field_list)
    # 共通のフィールド名調整（内部でtypeチェック）
    data = adjust_field_names(data)
    return _format_list(data)

def get_entity(entity: str, entity_id: int) -> Any:
    filters = [["id", "is", entity_id]]
    field_list = entity_fields.get(entity)
    data = sg.find_one(entity, filters, field_list)
    # 共通のフィールド名調整（内部でtypeチェック）
    data = adjust_field_names(data)
    return _format_dict(data) if data else data


# モデルごとのフィールドリマップルール
field_remap = {
    "Asset": [("step.color", "color")],
    "Task": [
        ("asset.phase.subproject", "subproject"),
        ("asset.work_category", "work_category"),
    ],
    "MilestoneTask": [
        ("asset.phase.subproject", "subproject"),
        ("asset.asset_type", "asset_type"),
    ],
    "PersonWorkload": [
        ("task.asset.phase.subproject", "subproject"),
    ],
}

def adjust_field_names(data):
    # そのまま返すべきケース
    if not data:
        return data
    if not isinstance(data, (list, dict)):
        return data

    # dictでもlistでも対応し、戻り値の型は入力に合わせる
    is_list = isinstance(data, list)
    items = data if is_list else [data]

    # 先頭要素からtypeを取得（全要素同一前提）
    first = items[0] if items else None
    entity_type = first.get("type") if isinstance(first, dict) else None

    # typeが無い、またはルール未定義なら処理せず返す
    if not entity_type or entity_type not in field_remap:
        # 追加: update_atフィールドのstr化のみ行う
        for item in items:
            if isinstance(item, dict) and "update_at" in item:
                val = item["update_at"]
                if isinstance(val, (datetime.datetime, datetime.date)):
                    item["update_at"] = val.strftime('%Y-%m-%d %H:%M:%S') if hasattr(val, 'hour') else val.strftime('%Y-%m-%d')
        return items if is_list else items[0]

    # ルール適用
    for old_key, new_key in field_remap[entity_type]:
        items = remap_key_in_list(items, old_key, new_key)

    # 追加: update_atフィールドのstr化
    for item in items:
        if isinstance(item, dict) and "update_at" in item:
            val = item["update_at"]
            if isinstance(val, (datetime.datetime, datetime.date)):
                item["update_at"] = val.strftime('%Y-%m-%d %H:%M:%S') if hasattr(val, 'hour') else val.strftime('%Y-%m-%d')

    return items if is_list else items[0]

def fetch_distribute_page() -> Any:
    """Distributeページ用: すべてのSubprojectとPhaseを取得"""
    subprojects = get_entities("Subproject")
    phases = get_entities("Phase")
    return {
        "subprojects": subprojects,
        "phases": phases,
    }


def fetch_basic_data(current_user_id: int) -> Any:
    person = get_entities("Person")
    steps = get_entities("Step")
    work_categories = get_entities("WorkCategory")
    current_user = get_entity("Person", current_user_id) if current_user_id else None
    return {
        "person": person,
        "steps": steps,
        "workCategories": work_categories,
        "currentUser": current_user,
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
    assets = get_entities("Asset", [["phase", "in", phase_ids]]) if phase_ids else []
    assets = adjust_field_names(assets)

    # Task取得（親: Asset）
    asset_ids = [asset["id"] for asset in assets]
    tasks = get_entities("Task", [["asset", "in", asset_ids]]) if asset_ids else []
    tasks = adjust_field_names(tasks)

    # MilestoneTask取得（親: Asset、同一サブプロジェクトに属するもののみ）
    milestone_tasks = get_entities("MilestoneTask", [["asset", "in", asset_ids]]) if asset_ids else []
    milestone_tasks = adjust_field_names(milestone_tasks)

    # PersonWorkload取得（親: Task）
    task_ids = [task["id"] for task in tasks]
    personworkloads = get_entities("PersonWorkload", [["task", "in", task_ids]]) if task_ids else []
    personworkloads = adjust_field_names(personworkloads)

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
    tasks = get_entities(
        "Task",
        [["start_date", "<=", start], ["end_date", ">=", end]],
    )
    tasks = remap_key_in_list(tasks, "asset.phase.subproject", "subproject")

    personworkloads = get_entities(
        "PersonWorkload",
        [["week", ">=", start], ["week", "<=", end]],
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
    tasks = get_entities(
        "Task",
        [["start_date", "<=", end], ["end_date", ">=", start]],
    )
    tasks = remap_key_in_list(tasks, "asset.phase.subproject", "subproject")
    return {"tasks": tasks}

def fetch_assignment_workloads(start_iso: str, end_iso: str) -> Any:
    """期間内のPersonWorkloadのみを返す（週=weekが範囲内）"""
    start = _parse_iso_date(start_iso)
    end = _parse_iso_date(end_iso)
    personworkloads = get_entities(
        "PersonWorkload",
        [["week", ">=", start], ["week", "<=", end]],
    )
    personworkloads = remap_key_in_list(personworkloads, "task.asset.phase.subproject", "subproject")
    return {"personworkloads": personworkloads}

def init_load(project_id: int, person_list: List[int], assignment_range: Tuple[str, str], current_user_id: int) -> Any:
    """起動時ロード: 3ページの必要情報 + 基本情報(Step) を一括取得し、ID重複なしでマージして返す"""
    distribute = fetch_distribute_page()
    # project_page = fetch_project_page(project_id)
    # assignment_page = fetch_assignment_page(assignment_range[0], assignment_range[1])

    basic_data = fetch_basic_data(current_user_id)

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
        "currentUser": basic_data.get("currentUser", None),
    }

    return res


def create_entity(data: dict) -> Any:
    entity_type = data.get("type")
    fields = entity_fields.get(entity_type)
    data.pop("type")  # typeフィールドは削除
    try:
        result = sg.create(entity_type, data, fields)
        result = adjust_field_names(result)
        return _format_dict(result)
    except Exception as e:
        return {"error": True, "message": str(e)}

def update_entity(entity_id: int, data: dict) -> Any:
    entity_type = data.get("type")
    data.pop("type")  # typeフィールドは削除
    try:
        sg.update(entity_type, entity_id, data)
        result = get_entity(entity_type, entity_id)
        result = adjust_field_names(result)
        return _format_dict(result)
    except Exception as e:
        return {"error": True, "message": str(e)}

def delete_entity(entity_type: str, entity_id: int) -> bool:
    try:
        return sg.delete(entity_type, entity_id)
    except Exception as e:
        return {"error": True, "message": str(e)}
    

# --- Edit Lock Control ---
def acquire_edit_lock(subproject_id: int, user_id: int) -> dict:
    """
    Try to acquire edit lock for a subproject. Returns success status and editing user info if failed.
    """
    from datetime import datetime, timedelta
    subproject = get_entity("Subproject", subproject_id)
    now = datetime.now()
    editing = subproject.get("editing")
    last_edit = subproject.get("last_edit")
    # If no editing or editing is self or last_edit is None/old, allow
    if not editing or (editing and editing.get("id") == user_id) or not last_edit:
        # Lock allowed
        update_data = {
            "editing": {"type": "Person", "id": user_id},
            "last_edit": now.isoformat(timespec="seconds")
        }
        update_entity(subproject_id, {"type": "Subproject", **update_data})
        return {"success": True}
    # Check last_edit time
    try:
        last_edit_dt = datetime.fromisoformat(last_edit)
    except Exception:
        last_edit_dt = None
    if last_edit_dt and (now - last_edit_dt).total_seconds() > 5 * 60:
        # Lock expired, allow
        update_data = {
            "editing": {"type": "Person", "id": user_id},
            "last_edit": now.isoformat(timespec="seconds")
        }
        update_entity(subproject_id, {"type": "Subproject", **update_data})
        return {"success": True}
    # Otherwise, locked by another user
    return {
        "success": False,
        "editingUser": editing,
        "last_edit": last_edit
    }

def heartbeat_edit_lock(subproject_id: int, user_id: int) -> dict:
    """
    Update last_edit if editing is current user.
    """
    from datetime import datetime
    subproject = get_entity("Subproject", subproject_id)
    editing = subproject.get("editing")
    if editing and editing.get("id") == user_id:
        update_entity(subproject_id, {"type": "Subproject", "last_edit": datetime.now().isoformat(timespec="seconds")})
        return {"success": True}
    return {"success": False}

def release_edit_lock(subproject_id: int, user_id: int) -> dict:
    """
    Release edit lock if editing is current user.
    """
    subproject = get_entity("Subproject", subproject_id)
    editing = subproject.get("editing")
    if editing and editing.get("id") == user_id:
        update_entity(subproject_id, {"type": "Subproject", "editing": None, "last_edit": None})
        return {"success": True}
    return {"success": False}
