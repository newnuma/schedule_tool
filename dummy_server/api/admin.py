# Django管理画面へのモデル登録
# 管理UIからデータ追加・編集・削除ができるようにする
from django.contrib import admin

from .models import (
    Department,
    Step,
    Person,
    Subproject,
    Phase,
    Asset,
    Task,
    PersonWorkload,
    PMMWorkload,
    WorkCategory,
)


admin.site.register(Department)
admin.site.register(Step)
admin.site.register(Person)
admin.site.register(Subproject)
admin.site.register(Phase)
admin.site.register(Asset)
admin.site.register(Task)
admin.site.register(PersonWorkload)
admin.site.register(PMMWorkload)
admin.site.register(WorkCategory)

