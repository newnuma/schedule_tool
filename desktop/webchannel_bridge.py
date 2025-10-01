"""Bridge definitions for Qt WebChannel communication."""

from typing import Any, Tuple
from PySide6.QtCore import QObject, Slot
from PySide6.QtWidgets import QFileDialog

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
        """Export PMMWorkload records to a pivoted CSV (rows=work_category, columns=week)."""
        try:
            payload = json.loads(data)
            subproject = payload.get("subproject") or {}
            records = payload.get("records") or []
            if not subproject or not records:
                return {"success": False, "error": "Missing subproject or records"}

            # Build unique weeks in ascending order
            weeks = sorted({r.get("week") for r in records if r.get("week")})

            # Aggregate man_week by (category_name, week)
            from collections import defaultdict
            matrix = defaultdict(lambda: {w: 0.0 for w in weeks})
            for r in records:
                week = r.get("week")
                if not week:
                    continue
                wc = r.get("work_category") or {}
                name = wc.get("name") or "Unassigned"
                try:
                    val = float(r.get("man_week") or 0)
                except Exception:
                    val = 0.0
                matrix[name][week] = matrix[name].get(week, 0.0) + val

            # Sort categories by name
            category_names = sorted(matrix.keys(), key=lambda s: (s is None, str(s)))

            # Default filename
            def _sanitize(s: str) -> str:
                import re
                return re.sub(r"[^\w\-_. ]", "_", s or "")

            sp_name = _sanitize(subproject.get("name") or f"Subproject_{subproject.get('id')}")
            first_w = weeks[0] if weeks else ""
            last_w = weeks[-1] if weeks else ""
            default_name = f"PMM_{sp_name}_{first_w}_{last_w}.csv" if weeks else f"PMM_{sp_name}.csv"

            # Ask user where to save
            path, _ = QFileDialog.getSaveFileName(None, "Save CSV", default_name, "CSV Files (*.csv)")
            if not path:
                return {"success": False, "error": "canceled"}

            # Write CSV (utf-8-sig for Excel)
            import csv
            with open(path, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f)
                header = ["Work Category", *weeks]
                writer.writerow(header)
                for name in category_names:
                    row = [name]
                    row.extend([matrix[name].get(w, 0.0) for w in weeks])
                    writer.writerow(row)

            return {"success": True, "path": path}
        except Exception as e:
            return {"success": False, "error": str(e)}

