from PySide6.QtCore import QObject, Slot, Signal
from PySide6.QtWebChannel import QWebChannelAbstractTransport
from PySide6.QtWebSockets import QWebSocket


class WebSocketTransport(QWebChannelAbstractTransport):
    """Transport layer between QWebChannel and a QWebSocket."""

    messageReceived = Signal(str)

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
        self.messageReceived.emit(message)

    @Slot(bytes)
    def on_binary_message(self, message: bytes) -> None:
        decoded = bytes(message).decode("utf-8")
        print("[WebSocketTransport] binary message", decoded)
        self.messageReceived.emit(decoded)

    def sendMessage(self, message: str) -> None:  # type: ignore[override]
        self._socket.sendTextMessage(message)
