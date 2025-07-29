"""Abstraction for accessing Flow-PT like entities.

In development mode this uses :class:`dummy_server.fake_shotgun.FakeShotgun`.
When ``USE_DUMMY_SHOTGUN`` is unset it falls back to ``shotgun_api3.Shotgun``.
The exported helper functions keep the old interface used by the Qt bridge
layer so the frontend does not need to change.
"""

from typing import Any, List, Optional

from shotgun_wrapper import ShotgunClient


sg = ShotgunClient()


def _find(entity: str, filters: Optional[List] = None, fields: Optional[List[str]] = None) -> Any:
    return sg.find(entity, filters or [], fields)


def get_subprojects() -> Any:
    return _find("Subproject")


def get_subproject(subproject_id: int) -> Any:
    return _find("Subproject", [["id", "is", subproject_id]])[0]


def get_phases() -> Any:
    return _find("Phase")


def get_phase(phase_id: int) -> Any:
    return _find("Phase", [["id", "is", phase_id]])[0]


def get_assets() -> Any:
    return _find("Asset")


def get_asset(asset_id: int) -> Any:
    return _find("Asset", [["id", "is", asset_id]])[0]


def get_tasks() -> Any:
    return _find("Task")


def get_task(task_id: int) -> Any:
    return _find("Task", [["id", "is", task_id]])[0]


def get_workloads() -> Any:
    return _find("Workload")


def get_workload(workload_id: int) -> Any:
    return _find("Workload", [["id", "is", workload_id]])[0]


def get_people() -> Any:
    return _find("Person")


def get_person(person_id: int) -> Any:
    return _find("Person", [["id", "is", person_id]])[0]


def get_workcategories() -> Any:
    return _find("WorkCategory")


def get_workcategory(category_id: int) -> Any:
    return _find("WorkCategory", [["id", "is", category_id]])[0]

