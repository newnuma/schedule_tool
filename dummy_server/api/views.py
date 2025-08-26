"""View definitions for the dummy REST API."""

from rest_framework import viewsets

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
from .serializers import (
    DepartmentSerializer,
    StepSerializer,
    PersonSerializer,
    SubprojectSerializer,
    PhaseSerializer,
    AssetSerializer,
    TaskSerializer,
    PersonWorkloadSerializer,
    PMMWorkloadSerializer,
    WorkCategorySerializer,
)


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class StepViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Step.objects.all()
    serializer_class = StepSerializer


class PersonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer


class SubprojectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subproject.objects.all()
    serializer_class = SubprojectSerializer


class PhaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Phase.objects.all()
    serializer_class = PhaseSerializer


class AssetViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer


class TaskViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class PersonWorkloadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PersonWorkload.objects.all()
    serializer_class = PersonWorkloadSerializer


class PMMWorkloadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PMMWorkload.objects.all()
    serializer_class = PMMWorkloadSerializer


class WorkCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkCategory.objects.all()
    serializer_class = WorkCategorySerializer

