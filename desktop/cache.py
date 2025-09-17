import json
import os

import getpass

# ユーザープロファイルのデスクトップにcache.jsonを配置
USER_DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")
CACHE_FILE = os.path.join(USER_DESKTOP, "cache.json")

def load_cache():
    if not os.path.exists(CACHE_FILE):
        # ファイルがなければ空のJSONファイルを新規作成
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, ensure_ascii=False, indent=2)
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