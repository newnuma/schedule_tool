# サーバーで使用するデータモデル定義
# Person, Subproject, Phase, Asset, Task, Workload, WorkCategoryなど

from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=128)
    email = models.EmailField(unique=True, blank=True, null=True)
    # 追加属性があればここに

    def __str__(self):
        return self.name

class Subproject(models.Model):
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    people = models.ManyToManyField(Person, related_name='subprojects', blank=True)
    is_edding = models.BooleanField(default=False)  # EDDINGかどうか

    def __str__(self):
        return self.name

class Phase(models.Model):
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE, related_name='phases')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.subproject.name} - {self.name}"

class Asset(models.Model):
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    #Type EXT INT Commonの三種類
    type = models.CharField(max_length=32, choices=[
        ('EXT', 'EXT'),
        ('INT', 'INT'),
        ('Common', 'Common')
    ], default='Common')
    work_category = models.ForeignKey('WorkCategory', on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    status = models.CharField(max_length=32, choices=[
        ('waiting', 'waiting'), 
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ], default='Not Started')

    def __str__(self):
        return f"{self.phase.subproject.name} - {self.phase.name} - {self.name}"

class Task(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    people = models.ManyToManyField(Person, related_name='tasks', blank=True)
    status = models.CharField(max_length=32, choices=[
        ('waiting', 'waiting'), 
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ], default='Not Started')

    def __str__(self):
        return f"{self.asset.phase.subproject.name} - {self.asset.phase.name} - {self.asset.name} - {self.name}"

class Workload(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='workloads')
    name = models.CharField(max_length=128)
    start_date = models.DateField()
    people = models.ForeignKey(Person, on_delete=models.CASCADE, blank=True)
    hours = models.FloatField(max_digits=5, decimal_places=1)

    def __str__(self):
        return f"{self.task.asset.phase.subproject.name} - {self.task.asset.phase.name} - {self.task.asset.name} - {self.task.name} - {self.name}"

class WorkCategory(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name