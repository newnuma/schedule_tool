from PySide6.QtCore import Slot, Signal
from PySide6.QtWebChannel import QWebChannelAbstractTransport
from PySide6.QtWebSockets import QWebSocket
import json


class WebSocketTransport(QWebChannelAbstractTransport):
    """Transport layer between QWebChannel and a QWebSocket."""

    # Matches QWebChannelAbstractTransport.messageReceived(QJsonObject, QWebChannelAbstractTransport*)
    messageReceived = Signal(dict)

    def __init__(self, socket: QWebSocket):
        super().__init__()
        self._socket = socket
        socket.textMessageReceived.connect(self.on_text_message)
        socket.binaryMessageReceived.connect(self.on_binary_message)
        socket.disconnected.connect(self.deleteLater)
        print("[WebSocketTransport] new connection")

    @Slot(str)
    def on_text_message(self, message: str) -> None:
        print("[WebSocketTransport] text message", message)
        try:
            data = json.loads(message)
        except Exception:
            print("[WebSocketTransport] Invalid JSON received")
            return
        self.messageReceived.emit(data)

    @Slot(bytes)
    def on_binary_message(self, message: bytes) -> None:
        decoded = bytes(message).decode("utf-8")
        print("[WebSocketTransport] binary message", decoded)
        try:
            data = json.loads(decoded)
        except Exception:
            print("[WebSocketTransport] Invalid JSON received")
            return
        self.messageReceived.emit(data)

    def sendMessage(self, message: dict) -> None:  # type: ignore[override]
        serialized = json.dumps(message)
        print("[WebSocketTransport] send message", serialized)
        try:
            self._socket.sendTextMessage(serialized)
        except Exception as e:
            print("[WebSocketTransport] sendMessage ERROR:", e)
