"""Bridge definitions for Qt WebChannel communication."""

from typing import Any

from PySide6.QtCore import QObject, Slot

import api_client


class DataBridge(QObject):
    """Expose API client methods to the frontend via Qt WebChannel."""

    @Slot(result="QVariant")
    def getSubprojects(self) -> Any:  # noqa: N802 - Qt slot naming
        return api_client.get_subprojects()

    @Slot(int, result="QVariant")
    def getSubproject(self, subproject_id: int) -> Any:  # noqa: N802
        return api_client.get_subproject(subproject_id)

    @Slot(result="QVariant")
    def getPhases(self) -> Any:  # noqa: N802
        return api_client.get_phases()

    @Slot(int, result="QVariant")
    def getPhase(self, phase_id: int) -> Any:  # noqa: N802
        return api_client.get_phase(phase_id)

    @Slot(result="QVariant")
    def getAssets(self) -> Any:  # noqa: N802
        return api_client.get_assets()

    @Slot(int, result="QVariant")
    def getAsset(self, asset_id: int) -> Any:  # noqa: N802
        return api_client.get_asset(asset_id)

    @Slot(result="QVariant")
    def getTasks(self) -> Any:  # noqa: N802
        return api_client.get_tasks()

    @Slot(int, result="QVariant")
    def getTask(self, task_id: int) -> Any:  # noqa: N802
        return api_client.get_task(task_id)

    @Slot(result="QVariant")
    def getWorkloads(self) -> Any:  # noqa: N802
        return api_client.get_workloads()

    @Slot(int, result="QVariant")
    def getWorkload(self, workload_id: int) -> Any:  # noqa: N802
        return api_client.get_workload(workload_id)

    @Slot(result="QVariant")
    def getPeople(self) -> Any:  # noqa: N802
        return api_client.get_people()

    @Slot(int, result="QVariant")
    def getPerson(self, person_id: int) -> Any:  # noqa: N802
        return api_client.get_person(person_id)

    @Slot(result="QVariant")
    def getWorkcategories(self) -> Any:  # noqa: N802
        return api_client.get_workcategories()

    @Slot(int, result="QVariant")
    def getWorkcategory(self, category_id: int) -> Any:  # noqa: N802
        return api_client.get_workcategory(category_id)

