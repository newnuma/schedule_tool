"""Simple HTTP client for the local Django dummy server."""

from typing import Any

import requests


BASE_URL = "http://localhost:8000/api"


def _get_json(path: str) -> Any:
    url = f"{BASE_URL}/{path}"
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()


def get_subprojects() -> Any:
    return _get_json("subprojects/")


def get_subproject(subproject_id: int) -> Any:
    return _get_json(f"subprojects/{subproject_id}/")


def get_phases() -> Any:
    return _get_json("phases/")


def get_phase(phase_id: int) -> Any:
    return _get_json(f"phases/{phase_id}/")


def get_assets() -> Any:
    return _get_json("assets/")


def get_asset(asset_id: int) -> Any:
    return _get_json(f"assets/{asset_id}/")


def get_tasks() -> Any:
    return _get_json("tasks/")


def get_task(task_id: int) -> Any:
    return _get_json(f"tasks/{task_id}/")


def get_workloads() -> Any:
    return _get_json("workloads/")


def get_workload(workload_id: int) -> Any:
    return _get_json(f"workloads/{workload_id}/")


def get_people() -> Any:
    return _get_json("people/")


def get_person(person_id: int) -> Any:
    return _get_json(f"people/{person_id}/")


def get_workcategories() -> Any:
    return _get_json("workcategories/")


def get_workcategory(category_id: int) -> Any:
    return _get_json(f"workcategories/{category_id}/")

