"""Automotive design-themed sample data generator.

Use in Django shell:
  python manage.py shell -c "exec(open('dummy_server/api/sample_data.py', encoding='utf-8').read())"
"""

from api.models import (
    Department,
    Step,
    Person,
    Subproject,
    Phase,
    Asset,
    Task,
    MilestoneTask,
    PersonWorkload,
    PMMWorkload,
    WorkCategory,
)
from datetime import date, timedelta
import random

# Wipe existing data (order matters due to FKs)
PersonWorkload.objects.all().delete()
PMMWorkload.objects.all().delete()
Task.objects.all().delete()
Asset.objects.all().delete()
Phase.objects.all().delete()
Subproject.objects.all().delete()
Person.objects.all().delete()
Department.objects.all().delete()
Step.objects.all().delete()
WorkCategory.objects.all().delete()

# Departments (automotive-focused)
dept_names = [
    ("Exterior Design", "外装デザイン"),
    ("Interior Design", "内装デザイン"),
    ("CMF", "カラー・素材・仕上げ"),
    ("Engineering", "設計・エンジニアリング"),
    ("Prototype", "試作・モックアップ"),
]
departments = [Department.objects.create(name=n, description=d) for n, d in dept_names]

# Steps (pipeline steps with colors)
steps_data = [
    ("Sketch", "255, 200, 0"),
    ("Clay Modeling", "210, 105, 30"),
    ("Digital Modeling", "70, 130, 180"),
    ("Surfacing", "100, 149, 237"),
    ("Prototyping", "46, 139, 87"),
]
steps = [Step.objects.create(name=n, color=c) for n, c in steps_data]

# People (~100)
people = []
base_names = [
    "Aiko", "Daichi", "Haruto", "Yuna", "Sora", "Ren", "Mio", "Hinata", "Kaito", "Rin",
    "Yuto", "Saki", "Koji", "Aya", "Tsubasa", "Mei", "Naoki", "Riku", "Sara", "Kei",
]
while len(base_names) < 50:
    base_names.append(f"Designer{len(base_names)+1:02d}")
for i in range(100):
    name = f"{base_names[i % len(base_names)]}-{i+1:03d}"
    dept = random.choice(departments)
    p = Person.objects.create(name=name, email=f"{name.lower().replace(' ', '')}@studio.example", department=dept)
    people.append(p)

# Assign managers randomly (some people have a manager)
for p in people:
    if random.random() < 0.5:
        mgr = random.choice([x for x in people if x != p])
        p.manager = mgr
        p.save()

# Work categories (auto design phases) ~10
wc_data = [
    ("Concept", "コンセプト立案"),
    ("Exterior", "外装"),
    ("Interior", "内装"),
    ("CMF", "カラー素材"),
    ("Aero", "空力"),
    ("Ergonomics", "人間工学"),
    ("HMI", "ヒューマンマシンインターフェース"),
    ("Packaging", "車室パッケージ"),
    ("Lighting", "照明設計"),
    ("Acoustic", "音響"),
]
categories = [WorkCategory.objects.create(name=n, description=d) for n, d in wc_data]

# Subprojects (~25, vehicle lines or model years)
subprojects = []
today = date.today()
for i in range(25):
    kind = random.choice(["Sedan", "SUV", "Coupe", "Hatchback", "EV Crossover", "Wagon", "Pickup"])
    year = 26 + (i // 5)
    name = f"{kind} MY{year} #{i+1:02d}"
    start = today + timedelta(days=i * 7)
    end = start + timedelta(days=120 + (i % 7) * 10)
    sp = Subproject.objects.create(
        name=name,
        start_date=start,
        end_date=end,
        editing=random.choice(people),
    pmm_status=random.choice(['planning', 'approved']),
    )
    # Assign people to subproject from the Person.subproject M2M side
    assigned = random.sample(people, k=random.randint(8, 15))
    for p in assigned:
        p.subproject.add(sp)
    subprojects.append(sp)

# Phases per subproject
phases = []
phase_types = ["DESIGN", "PRODT", "ENG"]
phase_names = ["Concept", "Design Development", "Final Design", "Milestone Review"]
for sp in subprojects:
    span = (sp.end_date - sp.start_date).days
    chunk = max(20, span // len(phase_names))
    phases_for_sp = []
    for i, pname in enumerate(phase_names):
        # Overlap periods intentionally
        ps = sp.start_date + timedelta(days=max(0, i * chunk - random.randint(0, 10)))
        pe = sp.start_date + timedelta(days=(i + 1) * chunk - 1 + random.randint(0, 10))
        if i == len(phase_names) - 1:
            pe = sp.end_date
        ptype = random.choice(phase_types)
        milestone_flag = (pname == "Milestone Review") or (i == 0 and random.random() < 0.5)
        ph = Phase.objects.create(
            subproject=sp,
            name=pname,
            start_date=ps,
            end_date=pe,
            type=ptype,
            milestone=milestone_flag,
        )
        phases.append(ph)
        phases_for_sp.append(ph)
    # Ensure at least one milestone=True per subproject
    if not any(p.milestone for p in phases_for_sp):
        phases_for_sp[0].milestone = True
        phases_for_sp[0].save()

# Assets per phase (e.g., body panels, interior areas)
assets = []
asset_name_sets = {
    "Concept": [
        "Exterior Theme A", "Exterior Theme B", "Interior Mood A", "Interior Mood B", "Color Board A",
        "Proportion Study", "Sketch Board A", "Sketch Board B"
    ],
    "Design Development": [
        "Front Fascia", "Rear Fascia", "Instrument Panel", "Seats", "Door Trim", "Console Module",
        "Steering Wheel", "Roof Console"
    ],
    "Final Design": [
        "Door Trim Final", "Center Console Final", "Headlamp Final", "Tail Lamp Final", "Grille Final",
        "Wheel Design", "Mirror Housing", "Rear Spoiler"
    ],
}
for ph in phases:
    names = asset_name_sets.get(ph.name, ["Generic Asset A", "Generic Asset B", "Generic Asset C", "Generic Asset D"])    
    # keep ~3-5 assets per phase to scale to ~250 assets overall
    per_phase = random.randint(3, min(5, len(names)))
    picks = random.sample(names, k=per_phase)
    for nm in picks:
        # distribute dates inside phase
        span = max(1, (ph.end_date - ph.start_date).days)
        local = max(7, span // per_phase)
        offset = random.randint(0, max(0, span - local))
        a_start = ph.start_date + timedelta(days=offset)
        a_end = min(ph.end_date, a_start + timedelta(days=local))
        asset = Asset.objects.create(
            phase=ph,
            name=nm,
            start_date=a_start,
            end_date=a_end,
            type=random.choice(['EXT', 'INT', 'Common']),
            work_category=random.choice(categories),
            step=random.choice(steps),
        )
        assets.append(asset)

# Tasks per asset (~2-4 each)
tasks = []
task_name_templates = [
    "Sketch refinement", "3D blockout", "Surface development", "Detailing", "Prototype fit check"
]
for asset in assets:
    n = random.randint(2, 4)
    aspan = max(1, (asset.end_date - asset.start_date).days)
    tspan = max(3, aspan // n)
    for i in range(n):
        t_start = asset.start_date + timedelta(days=min(i * tspan, max(0, aspan - 1)))
        t_end = min(asset.end_date, t_start + timedelta(days=tspan - 1))
        t = Task.objects.create(
            asset=asset,
            name=f"{random.choice(task_name_templates)} {i+1}",
            start_date=t_start,
            end_date=t_end,
            # match Task.status choices: 'wtg', 'ip', 'fin'
            status=random.choice(['wtg', 'ip', 'fin']),
        )
        t.assignees.set(random.sample(people, k=random.randint(1, 3)))
        tasks.append(t)

    # Milestone tasks per asset (0-2)
    mcount = random.randint(0, 2)
    for j in range(mcount):
        if asset.start_date > asset.end_date:
            continue
        span_days = max(1, (asset.end_date - asset.start_date).days)
        offset = random.randint(0, span_days - 1)
        m_date = asset.start_date + timedelta(days=offset)
        MilestoneTask.objects.create(
            asset=asset,
            name=f"{asset.name} Milestone {j+1}",
            start_date=m_date,
            end_date=m_date,
            milestone_type=random.choice(['Date Receive', 'Date Release', 'Review', 'DR'])
        )

# PersonWorkloads per task (week-based man-weeks, ~1-2 entries per task)
def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())

person_workloads = []
for t in tasks:
    assignees = list(t.assignees.all())
    if not assignees:
        continue
    weeks = []
    # choose 1-3 Mondays within the task period
    cur = monday_of(t.start_date)
    while cur <= t.end_date:
        weeks.append(cur)
        cur += timedelta(days=7)
    for i in range(random.randint(1, min(2, len(weeks)) )):
        wk = random.choice(weeks)
        pw = PersonWorkload.objects.create(
            task=t,
            person=random.choice(assignees),
            name=f"{t.name} - W{i+1}",
            week=wk,
            man_week=round(random.uniform(0.2, 1.0), 1),
        )
        person_workloads.append(pw)

# PMMWorkloads per subproject & work category per week
pmm_workloads = []
for sp in subprojects:
    weeks = []
    cur = monday_of(sp.start_date)
    while cur <= sp.end_date:
        weeks.append(cur)
        cur += timedelta(days=7)
    for wk in weeks:
        for wc in random.sample(categories, k=min(4, len(categories))):
            pmm = PMMWorkload.objects.create(
                subproject=sp,
                work_category=wc,
                name=f"{sp.name} - {wc.name}",
                week=wk,
                man_week=round(random.uniform(1.0, 5.0), 1),
            )
            pmm_workloads.append(pmm)

print("Sample data inserted!")
print("Created:")
print(f"  - {len(departments)} Departments")
print(f"  - {len(steps)} Steps")
print(f"  - {len(people)} People")
print(f"  - {len(categories)} Work Categories")
print(f"  - {len(subprojects)} Subprojects")
print(f"  - {len(phases)} Phases")
print(f"  - {len(assets)} Assets")
print(f"  - {len(tasks)} Tasks")
print(f"  - {len(person_workloads)} PersonWorkloads")
print(f"  - {len(pmm_workloads)} PMMWorkloads")
