import json
import os

DEFAULT_CONFIG = {
    "mode": "desktop",
    "react_url": "http://localhost:3000",
    "build_path": "./frontend/build/index.html",
    "webchannel_port": 12345,
}


def load_config() -> dict:
    """Load configuration from ../config.json if present."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config.json")
    config = DEFAULT_CONFIG.copy()
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_cfg = json.load(f)
                if isinstance(user_cfg, dict):
                    config.update(user_cfg)
        except Exception as exc:  # pragma: no cover - simple load
            print(f"Failed to load config: {exc}")
    return config
