import json
import os

CACHE_FILE = os.path.join(os.path.dirname(__file__), "cache.json")

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
    return project_id, person_list

def set_project_id_and_person_list(project_id, person_list):
    cache = load_cache()
    cache["project_id"] = project_id
    cache["person_list"] = person_list
    save_cache(cache)# データ構造や型定義を記載（必要な場合）
# サーバーやReactとやりとりするデータの型や補助的なクラスを定義
