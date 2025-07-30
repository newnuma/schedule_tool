from api.models import Person, Subproject, Phase, Asset, Task, Workload, WorkCategory
from datetime import date, timedelta

# 既存データ削除
Person.objects.all().delete()
Subproject.objects.all().delete()
Phase.objects.all().delete()
Asset.objects.all().delete()
Task.objects.all().delete()
Workload.objects.all().delete()
WorkCategory.objects.all().delete()

# 1. Person
alice = Person.objects.create(name="Alice", email="alice@example.com")
bob = Person.objects.create(name="Bob", email="bob@example.com")
carol = Person.objects.create(name="Carol", email="carol@example.com")
dave = Person.objects.create(name="Dave", email="dave@example.com")
eve = Person.objects.create(name="Eve", email="eve@example.com")

# 2. WorkCategory
cat_mod = WorkCategory.objects.create(name="Modeling", description="3Dモデリング")
cat_anim = WorkCategory.objects.create(name="Animation", description="アニメーション")
cat_comp = WorkCategory.objects.create(name="Compositing", description="合成")
cat_rig = WorkCategory.objects.create(name="Rigging", description="リギング")

# 3. Subproject
sp1 = Subproject.objects.create(
    name="Project Alpha",
    start_date=date.today(),
    end_date=date.today() + timedelta(days=60),
    is_edding=False
)
sp1.people.set([alice, bob, dave])

sp2 = Subproject.objects.create(
    name="Project Beta",
    start_date=date.today(),
    end_date=date.today() + timedelta(days=90),
    is_edding=True
)
sp2.people.set([carol, eve])

sp3 = Subproject.objects.create(
    name="Project Gamma",
    start_date=date.today(),
    end_date=date.today() + timedelta(days=120),
    is_edding=False
)
sp3.people.set([alice, eve])

# 4. Phase
ph1 = Phase.objects.create(subproject=sp1, name="Phase 1", start_date=date.today(), end_date=date.today() + timedelta(days=30))
ph2 = Phase.objects.create(subproject=sp1, name="Phase 2", start_date=date.today() + timedelta(days=31), end_date=date.today() + timedelta(days=60))
ph3 = Phase.objects.create(subproject=sp2, name="Phase 1", start_date=date.today(), end_date=date.today() + timedelta(days=45))
ph4 = Phase.objects.create(subproject=sp3, name="Phase 1", start_date=date.today(), end_date=date.today() + timedelta(days=60))
ph5 = Phase.objects.create(subproject=sp3, name="Phase 2", start_date=date.today() + timedelta(days=61), end_date=date.today() + timedelta(days=120))

# 5. Asset
as1 = Asset.objects.create(phase=ph1, name="Asset_A1", start_date=ph1.start_date, end_date=ph1.end_date, type="EXT", work_category=cat_mod, status="waiting")
as2 = Asset.objects.create(phase=ph2, name="Asset_A2", start_date=ph2.start_date, end_date=ph2.end_date, type="INT", work_category=cat_anim, status="In Progress")
as3 = Asset.objects.create(phase=ph3, name="Asset_B1", start_date=ph3.start_date, end_date=ph3.end_date, type="Common", work_category=cat_comp, status="Completed")
as4 = Asset.objects.create(phase=ph4, name="Asset_C1", start_date=ph4.start_date, end_date=ph4.end_date, type="EXT", work_category=cat_rig, status="waiting")
as5 = Asset.objects.create(phase=ph5, name="Asset_C2", start_date=ph5.start_date, end_date=ph5.end_date, type="INT", work_category=cat_mod, status="In Progress")

# 6. Task
tk1 = Task.objects.create(asset=as1, name="Task_A1-1", start_date=as1.start_date, end_date=as1.end_date, status="waiting")
tk1.people.set([alice, bob])
tk2 = Task.objects.create(asset=as2, name="Task_A2-1", start_date=as2.start_date, end_date=as2.end_date, status="In Progress")
tk2.people.set([alice])
tk3 = Task.objects.create(asset=as3, name="Task_B1-1", start_date=as3.start_date, end_date=as3.end_date, status="Completed")
tk3.people.set([carol])
tk4 = Task.objects.create(asset=as4, name="Task_C1-1", start_date=as4.start_date, end_date=as4.end_date, status="waiting")
tk4.people.set([eve, dave])
tk5 = Task.objects.create(asset=as5, name="Task_C2-1", start_date=as5.start_date, end_date=as5.end_date, status="In Progress")
tk5.people.set([alice, eve])

# 7. Workload
wl1 = Workload.objects.create(task=tk1, name="Workload1", start_date=as1.start_date, people=alice, hours=12.0)
wl2 = Workload.objects.create(task=tk1, name="Workload2", start_date=as1.start_date, people=bob, hours=8.5)
wl3 = Workload.objects.create(task=tk2, name="Workload3", start_date=as2.start_date, people=alice, hours=15.0)
wl4 = Workload.objects.create(task=tk3, name="Workload4", start_date=as3.start_date, people=carol, hours=10.0)
wl5 = Workload.objects.create(task=tk4, name="Workload5", start_date=as4.start_date, people=eve, hours=9.0)
wl6 = Workload.objects.create(task=tk4, name="Workload6", start_date=as4.start_date, people=dave, hours=7.5)
wl7 = Workload.objects.create(task=tk5, name="Workload7", start_date=as5.start_date, people=alice, hours=11.0)
wl8 = Workload.objects.create(task=tk5, name="Workload8", start_date=as5.start_date, people=eve, hours=13.0)

print("Sample data inserted!")
