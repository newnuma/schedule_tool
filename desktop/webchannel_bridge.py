"""Bridge definitions for Qt WebChannel communication."""

from typing import Any, Tuple
from PySide6.QtCore import QObject, Slot

import api_client
import cache  # 追加


class DataBridge(QObject):
    """Expose API client methods to the frontend via Qt WebChannel."""

    def _default_assignment_range(self) -> Tuple[str, str]:
        import datetime as _dt
        today = _dt.date.today()
        # start: this week's Monday
        start = today - _dt.timedelta(days=today.weekday())
        # 8 weeks window
        end = start + _dt.timedelta(weeks=8) - _dt.timedelta(days=1)
        return (start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d'))

    # Init loader: steps + three pages worth of data
    @Slot(result="QVariant")
    def initLoad(self) -> Any:
        project_id, person_list = cache.get_project_id_and_person_list()
        start, end = self._default_assignment_range()
        return api_client.init_load(project_id, person_list, (start, end))
    
    # Page-specific fetchers
    @Slot(result="QVariant")
    def fetchDistributePage(self) -> Any:
        return api_client.fetch_distribute_page()

    @Slot(int, result="QVariant")
    def fetchProjectPage(self, subproject_id: int) -> Any:
        return api_client.fetch_project_page(subproject_id)

    @Slot(str, str, result="QVariant")
    def fetchAssignmentPage(self, start: str, end: str) -> Any:
        return api_client.fetch_assignment_page(start, end)

    @Slot(result="QVariant")
    def fetchSteps(self) -> Any:
        return api_client.fetch_steps()

    @Slot(str, str, result="QVariant")
    def fetchAssignmentTasks(self, start: str, end: str) -> Any:
        return api_client.fetch_assignment_tasks(start, end)

    @Slot(str, str, result="QVariant")
    def fetchAssignmentWorkloads(self, start: str, end: str) -> Any:
        return api_client.fetch_assignment_workloads(start, end)

    # @Slot(int, result="QVariant")
    # def getSubproject(self, subproject_id: int) -> Any:  # noqa: N802
    #     return api_client.get_subproject(subproject_id)

