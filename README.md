# Gantt Desktop Scheduler (仮称)

## 概要

本ツールは、デスクトップ向けのスケジュール管理アプリです。  
Autodesk Flow Production TrackingのAPI互換を目指しつつ、  
**ガントチャートによるプロジェクト・工程・作業割当管理**を手元PCで安全・高速に行えます。

- **デスクトップアプリ**（PySide6/QWebEngineView）
- **フロントエンド**：React(TypeScript) + gantt-task-react
- **データ保存**：各ユーザーPC内にJSONファイルで実データ・キャッシュをローカル保存
- **仮APIサーバー**：Django+DRFでFlow Production Tracking風のAPIをダミー実装

---

## 画面構成・主な機能

- **Distribute**
  - サブプロジェクト・フェーズ横断の全体ガントチャート
- **Project**
  - プロジェクト毎の詳細（Asset, Task, Workloadタブで管理・編集）
- **Assignment**
  - Person別のタスク・工数ガント/表ビュー、割当管理

---

## 技術構成・フォルダ構成

```plaintext
myapp/
├── frontend/      # React+TypeScript, 各ページ・部品・Context・API
├── desktop/       # PySide6デスクトップUI, APIブリッジ, ローカルキャッシュ管理
├── dummy_server/  # Django+DRF仮API（開発・テスト用）
各ディレクトリの概要
frontend/
React/TypeScript製UI（Distribute/Project/Assignmentなど各画面）、Contextで状態管理。
PySide6のQWebChannel経由でAPI・キャッシュ連携。

desktop/
PySide6でQWebEngineView上にビルド済みReactアプリを表示。
QtWebChannel経由でフロントと双方向データ連携。
ユーザーキャッシュ・各種設定はPC内の標準保存ディレクトリにJSONで永続化。

dummy_server/
Django+DRFで仮APIを実装。モデルは「subproject, phase, asset, task, workload, person」等。
開発時に実API連携の代替として利用。

データ・キャッシュ保存仕様
各ユーザーごとに「OSのユーザーデータ保存先」にcache.jsonとして保存

Windows: C:\Users\<ユーザー名>\AppData\Local\<アプリ名>\cache.json

macOS: /Users/<ユーザー名>/Library/Application Support/<アプリ名>/cache.json

Linux: /home/<ユーザー名>/.config/<アプリ名>/cache.json

保存内容例: 最後に選択したプロジェクトやAssignment画面のpersonリスト等

開発・実行方法（例）
初回セットアップ
bash
コピーする
編集する
# dummy_server(Django)セットアップ
cd dummy_server
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# frontend(React)セットアップ
cd ../frontend
npm install
npm run build   # 本番ビルド

# desktop(PySide6)セットアップ
cd ../desktop
pip install -r requirements.txt
python app_window.py
注意事項・設計ポリシー
本番用途ではなくプロトタイプ・開発検証用

本ツールで作成・保存されるデータは全てローカルPC内でのみ管理（外部サーバー非依存）

画面構成や操作体系はPPT構想資料（/docsなど）も参照

開発・拡張にあたって
新たな画面・機能追加時はfrontend/src/pages/配下にページを追加

ローカルキャッシュの項目追加時はdesktop/cache.pyを拡張

Flow Production Tracking等の実API連携もdesktop/api_client.pyを拡張する形で実現可

