"""Bridge definitions for Qt WebChannel communication."""

from typing import Any
from PySide6.QtCore import QObject, Slot

import api_client
import cache  # 追加


class DataBridge(QObject):
    """Expose API client methods to the frontend via Qt WebChannel."""

    @Slot(result="QVariant")
    def fetchAll(self) -> Any:
        project_id, person_list = cache.get_project_id_and_person_list()
        return api_client.fetch_all(project_id, person_list)
    
    @Slot(int, result="QVariant")
    def fetchSubproject(self, id: int) -> Any:
        return api_client.fetch_project_details(id)

    # @Slot(int, result="QVariant")
    # def getSubproject(self, subproject_id: int) -> Any:  # noqa: N802
    #     return api_client.get_subproject(subproject_id)

