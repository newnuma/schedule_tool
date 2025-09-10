# サーバーで使用するデータモデル定義
# Person, Subproject, Phase, Asset, Task, Workload, WorkCategoryなど

from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.name

class Step(models.Model):
    name = models.CharField(max_length=128)
    # rgb, "255, 255, 255"
    color = models.CharField(max_length=32, default="255, 255, 255")

    def __str__(self):
        return self.name


class Person(models.Model):
    name = models.CharField(max_length=128)
    email = models.EmailField(unique=True, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='people')
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    subproject = models.ManyToManyField('Subproject', related_name='people', blank=True)
    # 追加属性があればここに

    def __str__(self):
        return self.name

class Subproject(models.Model):
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    # people = models.ManyToManyField(Person, related_name='subprojects', blank=True)
    editing = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True, blank=True, related_name='editing_subprojects')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='subprojects')
    access = models.CharField(max_length=32, choices=[
        ('Common', 'Common'),
        ('Project Team', 'Project Team'),
        ('High Confidential', 'High Confidential'),
    ], default='Project Team')
    pmm_status = models.CharField(max_length=32, choices=[
        ('planning', 'planning'),
        ('approved', 'approved'),
    ], default='planning')

    def __str__(self):
        return self.name

class Phase(models.Model):
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE, related_name='phases')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    milestone = models.BooleanField(default=False)
    phase_type = models.CharField(max_length=32, choices=[
        ('DESIGN', 'DESIGN'),
        ('PRODT', 'PRODT'),
        ('ENG', 'ENG'),
    ], default='DESIGN')

    def __str__(self):
        return f"{self.subproject.name} - {self.name}"

class Asset(models.Model):
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    #Type EXT INT Commonの三種類
    asset_type = models.CharField(max_length=32, choices=[
        ('EXT', 'EXT'),
        ('INT', 'INT'),
        ('Common', 'Common')
    ], default='Common')
    work_category = models.ForeignKey('WorkCategory', on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    step = models.ForeignKey(Step, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')

    def __str__(self):
        return f"{self.phase.subproject.name} - {self.phase.name} - {self.name}"

class Task(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    assignees = models.ManyToManyField(Person, related_name='tasks', blank=True)
    status = models.CharField(max_length=32, choices=[
        ('wtg', 'wtg'), 
        ('ip', 'ip'),
        ('fin', 'fin'),
    ], default='wtg')

    def __str__(self):
        return f"{self.asset.phase.subproject.name} - {self.asset.phase.name} - {self.asset.name} - {self.name}"

class MilestoneTask(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='milestone_tasks')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    milestone_type = models.CharField(max_length=32, choices=[
        ('Date Receive', 'Date Receive'),
        ('Date Release', 'Date Release'),
        ('Review', 'Review'),
        ('DR', 'DR')
    ], default='Review')

    def __str__(self):
        return f"{self.asset.phase.subproject.name} - {self.asset.phase.name} - {self.asset.name} - {self.name}"

# Taskにアサインされている人ごとの工数（週単位）
class PersonWorkload(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='workloads')
    person = models.ForeignKey(Person, on_delete=models.CASCADE, blank=True) #taskのassigneesから選択
    name = models.CharField(max_length=128)
    week = models.DateField() #週の月曜日の日付を指定
    man_week = models.DecimalField(max_digits=5, decimal_places=1)

    def __str__(self):
        return f"{self.task.asset.phase.subproject.name} - {self.task.asset.phase.name} - {self.task.asset.name} - {self.task.name} - {self.name}"

# SubProjectのWorkCategory毎に与えられている工数（週単位）
class PMMWorkload(models.Model):
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE, related_name='pmm_workloads')
    work_category = models.ForeignKey('WorkCategory', on_delete=models.SET_NULL, null=True, blank=True, related_name='pmm_workloads')   
    name = models.CharField(max_length=128)
    week = models.DateField() #週の月曜日の日付を指定
    man_week = models.DecimalField(max_digits=5, decimal_places=1)

    def __str__(self):
        wc = self.work_category.name if self.work_category else "(No Category)"
        return f"{self.subproject.name} - {wc} - {self.name}"

class WorkCategory(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name