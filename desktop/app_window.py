import os
import sys
import webbrowser
from PySide6.QtCore import QUrl
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEnginePage
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebSockets import QWebSocketServer
from PySide6.QtNetwork import QHostAddress

from webchannel_bridge import DataBridge
from websocket_transport import WebSocketTransport
from app_config import load_config

os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--enable-logging --log-level=0"


class CustomWebEnginePage(QWebEnginePage):
    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        level_map = {0: "Info", 1: "Warning", 2: "Error"}
        level_str = level_map.get(level, str(level))
        print(f"[JS:{level_str}] {message} (at {sourceID}:{lineNumber})")


class AppWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.config = load_config()
        self.data_bridge = DataBridge()
        self.transports = []

        mode = self.config.get("mode", "desktop")
        if mode == "desktop":
            self._init_desktop_mode()
        else:
            self._init_web_debug_mode()

    # ----- desktop mode -----
    def _init_desktop_mode(self) -> None:
        self.setWindowTitle("Desktop Gantt App (PySide6)")
        self.resize(1280, 720)
        self.view = QWebEngineView(self)
        self.view.setPage(CustomWebEnginePage(self.view))
        self.setCentralWidget(self.view)

        self.channel = QWebChannel(self.view.page())
        self.channel.registerObject("dataBridge", self.data_bridge)
        self.view.page().setWebChannel(self.channel)

        build_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../frontend/build/index.html")
        )
        self.view.load(QUrl.fromLocalFile(build_path))

    # ----- web debug mode -----
    def _init_web_debug_mode(self) -> None:
        port = int(self.config.get("webchannel_port", 12345))
        self.server = QWebSocketServer("Backend", QWebSocketServer.NonSecureMode)
        self.server.listen(QHostAddress.LocalHost, port)

        self.channel = QWebChannel()
        self.channel.registerObject("dataBridge", self.data_bridge)
        self.server.newConnection.connect(self._on_new_connection)

        react_url = self.config.get("react_url", "http://localhost:3000")
        webbrowser.open(react_url)
        print(
            f"Web debug mode active. Listening on ws://localhost:{port} and opening {react_url}."
        )

    def _on_new_connection(self) -> None:
        socket = self.server.nextPendingConnection()
        if socket is None:
            return
        transport = WebSocketTransport(socket)
        self.transports.append(transport)
        print("[AppWindow] New WebSocket connection")
        self.channel.connectTo(transport)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    win = AppWindow()
    if win.config.get("mode", "desktop") == "desktop":
        win.show()
    sys.exit(app.exec())
