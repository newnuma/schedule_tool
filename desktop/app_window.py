import os
import sys
from PySide6.QtCore import QUrl
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebEngineCore import QWebEnginePage
from webchannel_bridge import DataBridge

os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--enable-logging --log-level=0"
class CustomWebEnginePage(QWebEnginePage):
    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        level_map = {0: "Info", 1: "Warning", 2: "Error"}
        level_str = level_map.get(level, str(level))
        print(f"[JS:{level_str}] {message} (at {sourceID}:{lineNumber})")
        
class AppWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Desktop Gantt App (PySide6)")
        self.resize(1280, 720)
        self.view = QWebEngineView(self)

        # カスタムページをセット
        self.view.setPage(CustomWebEnginePage(self.view))
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

    def handle_js_console_message(self, level, message, lineNumber, sourceID):
        print(f"[JS:{level}] {message} (at {sourceID}:{lineNumber})")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    win = AppWindow()
    win.show()
    sys.exit(app.exec())
