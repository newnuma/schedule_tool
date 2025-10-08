"""Bridge definitions for Qt WebChannel communication."""

from typing import Any, Tuple
from PySide6.QtCore import QObject, Slot, QStandardPaths
from PySide6.QtWidgets import QFileDialog, QApplication

import api_client
import cache  # 追加
import json


class DataBridge(QObject):
    @Slot(int, result="QVariant")
    def openFlowPtUrl(self, asset_id: int) -> Any:
        import webbrowser
        url = f"https://flow-pt.example.com/assets/{asset_id}"
        webbrowser.open(url)
        return {"success": True, "url": url}
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
        project_id, person_list, current_user = cache.get_project_id_and_person_list()
        # project_id= cache.get("project_id")
        if current_user is None:
            current_user = 386
        start, end = self._default_assignment_range()
        result = api_client.init_load(project_id, person_list, (start, end), current_user)
        result["filters"] = cache.load_cache().get("filters", {})  # キャッシュからフィルター情報を追加
        return result

    # Page-specific fetchers
    @Slot(result="QVariant")
    def fetchDistributePage(self) -> Any:
        return api_client.fetch_distribute_page()

    @Slot(int, result="QVariant")
    def fetchProjectPage(self, subproject_id: int) -> Any:
        result = api_client.fetch_project_page(subproject_id)
        cache.set_cache_value("project_id", subproject_id)  # キャッシュを保存
        return result

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
    
    @Slot(str, result="QVariant")
    def createEntity(self, data: str) -> Any:
        data_dict = json.loads(data)
        result = api_client.create_entity(data_dict)
        return result

    @Slot(int, str, result="QVariant")
    def updateEntity(self, id: int, data: str) -> Any:
        data_dict = json.loads(data)
        result = api_client.update_entity(id, data_dict)
        return result
    
    @Slot(str, int, result="QVariant")
    def deleteEntity(self, type: str, id: int) -> Any:
        result = api_client.delete_entity(type, id)
        return result
    
    @Slot(int, int, result="QVariant")
    def acquireEditLock(self, subproject_id: int, user_id: int) -> Any:
        result = api_client.acquire_edit_lock(subproject_id, user_id)
        return result
    
    @Slot(int, int, result="QVariant")
    def heartbeatEditLock(self, subproject_id: int, user_id: int) -> Any:
        result = api_client.heartbeat_edit_lock(subproject_id, user_id)
        return result
    
    @Slot(int, int, result="QVariant")
    def releaseEditLock(self, subproject_id: int, user_id: int) -> Any:
        result = api_client.release_edit_lock(subproject_id, user_id)
        return result
    
    @Slot(str, result="QVariant")
    def saveFilterConfig(self, data: str) -> Any:
        try:
            payload = json.loads(data)
            page_key = payload.get("pageKey")
            filter_config = payload.get("filterConfig")
            filters = cache.load_cache().get("filters", {})
            filters[page_key] = filter_config
            cache.set_cache_value("filters", filters)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # @Slot(int, result="QVariant")
    # def getSubproject(self, subproject_id: int) -> Any:  # noqa: N802
    #     return api_client.get_subproject(subproject_id)

    @Slot(str, result="QVariant")
    def exportPMMWorkloadsCSV(self, data: str) -> Any:
        """Export PMMWorkload records to a pivoted CSV via pmm_export module."""
        try:
            payload = json.loads(data)
            records = payload.get("records") or []
            if not records:
                return {"success": False, "error": "No records"}

            # Build default filename using helper
            import pmm_export as _pmm_export
            default_name = _pmm_export.suggest_csv_filename(payload)

            # Ask user where to save (use native dialog for familiar OS UI)
            opts = QFileDialog.Options()
            parent = QApplication.activeWindow()
            # Default to user's Downloads folder with suggested file name
            import os
            downloads = QStandardPaths.writableLocation(QStandardPaths.DownloadLocation) or os.path.expanduser("~/Downloads")
            initial = os.path.join(downloads, default_name) if downloads else default_name
            path, _ = QFileDialog.getSaveFileName(parent, "Save CSV", initial, "CSV Files (*.csv)", options=opts)
            if not path:
                return {"success": False, "error": "canceled"}

            # Delegate writing
            result = _pmm_export.export_pmm_workloads_to_csv(payload, path)
            return result
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}

    @Slot(str, result="QVariant")
    def exportPMMWorkloadsXlsx(self, data: str) -> Any:
        """Export PMM Workloads into a copied Excel template via pmm_export module."""
        try:
            payload = json.loads(data)
            # Allow export if either records or phases are provided
            if not payload or not (payload.get("records") or payload.get("phases")):
                return {"success": False, "error": "No records or phases"}

            # Determine template path from repo root: ../pmm_sample.xlsx relative to this file
            import os
            here = os.path.dirname(os.path.abspath(__file__))
            template_path = os.path.join(os.path.dirname(here), "pmm_sample.xlsx")

            # Ask where to save
            import pmm_export as _pmm_export
            suggested = _pmm_export.suggest_xlsx_filename(payload)

            # Ask where to save (use native dialog for familiar OS UI)
            opts = QFileDialog.Options()
            parent = QApplication.activeWindow()
            # Default to user's Downloads folder with suggested file name
            downloads = QStandardPaths.writableLocation(QStandardPaths.DownloadLocation) or os.path.expanduser("~/Downloads")
            initial = os.path.join(downloads, suggested) if downloads else suggested
            save_path, _ = QFileDialog.getSaveFileName(parent, "Save Excel", initial, "Excel Files (*.xlsx)", options=opts)
            if not save_path:
                return {"success": False, "error": "canceled"}

            # Call exporter
            result = _pmm_export.export_pmm_workloads_to_xlsx(payload, template_path, save_path)
            return result
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}

