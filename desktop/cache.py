import json
import os


# AppData\Roaming\<アプリ名>\cache.json に保存
APP_NAME = "schedule_tool"
APPDATA_DIR = os.path.join(os.path.expanduser("~"), "AppData", "Roaming", APP_NAME)
if not os.path.exists(APPDATA_DIR):
    os.makedirs(APPDATA_DIR, exist_ok=True)
CACHE_FILE = os.path.join(APPDATA_DIR, "cache.json")
# cache.jsonがなければ空ファイルを初期化
if not os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump({}, f, ensure_ascii=False, indent=2)

def load_cache():
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_cache(data):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_project_id_and_person_list():
    cache = load_cache()
    project_id = cache.get("project_id", 1)  # デフォルト値は適宜
    person_list = cache.get("person_list", [])
    current_user = cache.get("current_user", None)
    return project_id, person_list, current_user

def set_project_id_and_person_list(project_id, person_list, current_user):
    cache = load_cache()
    cache["project_id"] = project_id
    cache["person_list"] = person_list
    cache["current_user"] = current_user
    save_cache(cache)# データ構造や型定義を記載（必要な場合）
# サーバーやReactとやりとりするデータの型や補助的なクラスを定義

# 任意のキーと値でキャッシュを更新する関数
def set_cache_value(key, value):
    cache = load_cache()
    cache[key] = value
    save_cache(cache)