# Django管理画面へのモデル登録
# 管理UIからデータ追加・編集・削除ができるようにする
from django.contrib import admin

from .models import (
    Person,
    Subproject,
    Phase,
    Asset,
    Task,
    Workload,
    WorkCategory,
)


admin.site.register(Person)
admin.site.register(Subproject)
admin.site.register(Phase)
admin.site.register(Asset)
admin.site.register(Task)
admin.site.register(Workload)
admin.site.register(WorkCategory)

