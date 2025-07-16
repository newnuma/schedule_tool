# デスクトップアプリのメインウィンドウ制御ファイル
# PySide6のQWebEngineViewでビルド済みReact(frontend/build/index.html)を表示し、
# QtWebChannelを使いReactとPython側で双方向データ連携を行う

import os
import sys
from PySide6.QtCore import QUrl, QObject, Slot, Signal
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel

class DataBridge(QObject):
    # 例: React→Pythonでデータを受け取る
    @Slot(str)
    def printMessage(self, msg):
        print(f"Reactから受信: {msg}")

    # 例: Python→Reactへデータ送信用Signal
    dataSent = Signal(str)

    # 必要に応じてAPIアクセスメソッドも追加
    @Slot()
    def fetchProjects(self):
        resp = requests.get("http://localhost:8000/api/projects/")
        if resp.status_code == 200:
            # Python→Reactへデータ送信
            self.dataSent.emit(resp.text)  # JSON文字列
        else:
            self.dataSent.emit("[]")

class AppWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Desktop Gantt App (PySide6)")
        self.resize(1280, 720)
        self.view = QWebEngineView(self)
        self.setCentralWidget(self.view)

        # QWebChannelセットアップ
        self.channel = QWebChannel(self.view.page())
        self.data_bridge = DataBridge()
        self.channel.registerObject("dataBridge", self.data_bridge)
        self.view.page().setWebChannel(self.channel)

        # React build/index.htmlの絶対パスを取得
        build_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../frontend/build/index.html")
        )
        self.view.load(QUrl.fromLocalFile(build_path))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    win = AppWindow()
    win.show()
    sys.exit(app.exec())
