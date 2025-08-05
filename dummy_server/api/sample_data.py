# python manage.py shell → exec(open('dummy_server/api/sample_data.py', encoding="utf-8").read())

from api.models import Person, Subproject, Phase, Asset, Task, Workload, WorkCategory
from datetime import date, timedelta
import random

# 既存データ削除
Person.objects.all().delete()
Subproject.objects.all().delete()
Phase.objects.all().delete()
Asset.objects.all().delete()
Task.objects.all().delete()
Workload.objects.all().delete()
WorkCategory.objects.all().delete()

# 1. Person (25人に増加)
people = []
person_names = [
    "Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack",
    "Kate", "Liam", "Maya", "Noah", "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tina",
    "Uma", "Victor", "Wendy", "Xavier", "Yuki"
]

for i, name in enumerate(person_names):
    person = Person.objects.create(name=name, email=f"{name.lower()}@example.com")
    people.append(person)

# 2. WorkCategory (10個に増加)
categories = []
category_data = [
    ("Modeling", "3Dモデリング"),
    ("Animation", "アニメーション"), 
    ("Compositing", "合成"),
    ("Rigging", "リギング"),
    ("Texturing", "テクスチャリング"),
    ("Lighting", "ライティング"),
    ("Rendering", "レンダリング"),
    ("Effects", "エフェクト"),
    ("Layout", "レイアウト"),
    ("Concept", "コンセプトアート")
]

for name, desc in category_data:
    cat = WorkCategory.objects.create(name=name, description=desc)
    categories.append(cat)

# 3. Subproject (15個に増加)
subprojects = []
project_names = [
    "Project Alpha", "Project Beta", "Project Gamma", "Project Delta", "Project Epsilon",
    "Project Zeta", "Project Eta", "Project Theta", "Project Iota", "Project Kappa",
    "Project Lambda", "Project Mu", "Project Nu", "Project Xi", "Project Omicron"
]

for i, name in enumerate(project_names):
    start_date = date.today() + timedelta(days=i*10)
    end_date = start_date + timedelta(days=60 + i*5)
    is_edding = random.choice([True, False])
    
    sp = Subproject.objects.create(
        name=name,
        start_date=start_date,
        end_date=end_date,
        is_edding=is_edding
    )
    # ランダムに3-8人をアサイン
    assigned_people = random.sample(people, random.randint(3, 8))
    sp.people.set(assigned_people)
    subprojects.append(sp)

# 4. Phase (各プロジェクトに2-4個のPhase、合計約45個)
phases = []
for sp in subprojects:
    num_phases = random.randint(2, 4)
    phase_duration = (sp.end_date - sp.start_date).days // num_phases
    
    for i in range(num_phases):
        phase_start = sp.start_date + timedelta(days=i * phase_duration)
        phase_end = phase_start + timedelta(days=phase_duration - 1)
        if i == num_phases - 1:  # 最後のフェーズは終了日を合わせる
            phase_end = sp.end_date
        
        phase = Phase.objects.create(
            subproject=sp,
            name=f"Phase {i+1}",
            start_date=phase_start,
            end_date=phase_end
        )
        phases.append(phase)

# 5. Asset (各Phaseに3-6個のAsset、合計約200個)
assets = []
for phase in phases:
    num_assets = random.randint(3, 6)
    asset_duration = (phase.end_date - phase.start_date).days // num_assets
    
    for i in range(num_assets):
        asset_start = phase.start_date + timedelta(days=i * asset_duration)
        asset_end = asset_start + timedelta(days=asset_duration - 1)
        if i == num_assets - 1:  # 最後のアセットは終了日を合わせる
            asset_end = phase.end_date
        
        asset = Asset.objects.create(
            phase=phase,
            name=f"Asset_{phase.subproject.name[-1]}{i+1}",
            start_date=asset_start,
            end_date=asset_end,
            type=random.choice(['EXT', 'INT', 'Common']),
            work_category=random.choice(categories),
            status=random.choice(['waiting', 'In Progress', 'Completed'])
        )
        assets.append(asset)

# 6. Task (各Assetに2-4個のTask、合計約600個)
tasks = []
for asset in assets:
    num_tasks = random.randint(2, 4)
    task_duration = (asset.end_date - asset.start_date).days // num_tasks
    
    for i in range(num_tasks):
        task_start = asset.start_date + timedelta(days=i * task_duration)
        task_end = task_start + timedelta(days=task_duration - 1)
        if i == num_tasks - 1:  # 最後のタスクは終了日を合わせる
            task_end = asset.end_date
        
        task = Task.objects.create(
            asset=asset,
            name=f"Task_{asset.name}-{i+1}",
            start_date=task_start,
            end_date=task_end,
            status=random.choice(['waiting', 'In Progress', 'Completed'])
        )
        
        # ランダムに1-4人をタスクにアサイン
        num_assigned = random.randint(1, 4)
        assigned_people = random.sample(people, num_assigned)
        task.people.set(assigned_people)
        
        tasks.append(task)

# 7. Workload (各Taskに1-3個のWorkload、合計約1200個)
workloads = []
for task in tasks:
    task_people = list(task.people.all())
    if not task_people:
        continue
    
    num_workloads = random.randint(1, 3)
    
    for i in range(num_workloads):
        # タスクにアサインされた人の中からランダムに選択
        assigned_person = random.choice(task_people)
        hours = round(random.uniform(4.0, 20.0), 1)
        
        workload = Workload.objects.create(
            task=task,
            name=f"Workload_{task.name}-{i+1}",
            start_date=task.start_date + timedelta(days=random.randint(0, 3)),
            people=assigned_person,
            hours=hours
        )
        workloads.append(workload)

print(f"Sample data inserted!")
print(f"Created:")
print(f"  - {len(people)} People")
print(f"  - {len(categories)} Work Categories")
print(f"  - {len(subprojects)} Subprojects")
print(f"  - {len(phases)} Phases")
print(f"  - {len(assets)} Assets")
print(f"  - {len(tasks)} Tasks")
print(f"  - {len(workloads)} Workloads")
