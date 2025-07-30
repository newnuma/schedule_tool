"""Abstraction for accessing Flow-PT like entities.

In development mode this uses :class:`dummy_server.fake_shotgun.FakeShotgun`.
When ``USE_DUMMY_SHOTGUN`` is unset it falls back to ``shotgun_api3.Shotgun``.
The exported helper functions keep the old interface used by the Qt bridge
layer so the frontend does not need to change.
"""

from typing import Any, List, Optional

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


def get_entities(entity: str, filters: Optional[List] = None, fields: Optional[List[str]] = None) -> Any:
    return sg.find(entity, filters or [], fields)

def get_entity(entity: str, entity_id: int, fields: Optional[List[str]] = None) -> Any:
    filters = [["id", "is", entity_id]]
    return sg.find_one(entity, filters, fields)

def fetch_distribute() -> Any:
    # ProjectとPhaseを取得
    subproject = get_entities("Subproject")
    phases = get_entities("Phase")
    return {
        "projects": subproject ,
        "phases": phases,
    }

# 指定したIDのプロジェクトに関連する情報を取得
def fetch_project_details(project_id: int) -> Any:
    # Subproject（プロジェクト）取得
    subproject = get_entity("Subproject", project_id)
    if not subproject:
        return {
            "phases": [],
            "assets": [],
            "tasks": [],
            "workloads": [],
            "person": [],
        }

    # Phase取得（親: Subproject）
    phases = get_entities("Phase", [["subproject", "is", subproject["id"]]])

    # Asset取得（親: Phase）
    phase_ids = [phase["id"] for phase in phases]
    assets = get_entities("Asset", [["phase", "in", phase_ids]]) if phase_ids else []

    # Task取得（親: Asset）
    asset_ids = [asset["id"] for asset in assets]
    tasks = get_entities("Task", [["asset", "in", asset_ids]]) if asset_ids else []

    # Workload取得（親: Task）
    task_ids = [task["id"] for task in tasks]
    workloads = get_entities("Workload", [["task", "in", task_ids]]) if task_ids else []

    # Person取得（プロジェクトに紐づく全員）
    person = get_entities("Person", [["subproject", "is", subproject["id"]]])

    return {
        "subproject": subproject,
        "phases": phases,
        "assets": assets,
        "tasks": tasks,
        "workloads": workloads,
        "person": person,
    }

# メンバーリストにあるpersonに関連する情報を取得
def fetch_people_details(person_list : List[int]) -> Any:
    workloads = get_entities("Workload", [["person", "in", person_list]])
    tasks = get_entities("Task", [["person", "in", person_list]])   
    return {
        "workloads": workloads,
        "tasks": tasks,
    }

def fetch_all(project_id: int, person_list: List[int]) -> Any:
    """
    fetch_distribute, fetch_project_details, fetch_people_details をまとめて取得し、
    各エンティティごとにID重複なしでマージして返す
    """
    distribute = fetch_distribute()
    project_details = fetch_project_details(project_id)
    people_details = fetch_people_details(person_list)

    def merge_by_id(*lists, id_key="id"):
        merged = {}
        for lst in lists:
            for item in lst:
                merged[item[id_key]] = item
        return list(merged.values())

    return {
        "subproject": merge_by_id(distribute.get("subproject", []), [project_details.get("subproject")] if project_details.get("subproject") else []),
        "phases": merge_by_id(distribute.get("phases", []), project_details.get("phases", [])),
        "assets": merge_by_id(project_details.get("assets", [])),
        "tasks": merge_by_id(project_details.get("tasks", []), people_details.get("tasks", [])),
        "workloads": merge_by_id(project_details.get("workloads", []), people_details.get("workloads", [])),
        "person": merge_by_id(project_details.get("person", [])),
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

