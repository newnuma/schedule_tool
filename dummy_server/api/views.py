"""View definitions for the dummy REST API."""

from rest_framework import viewsets

from .models import (
    Person,
    Subproject,
    Phase,
    Asset,
    Task,
    Workload,
    WorkCategory,
)
from .serializers import (
    PersonSerializer,
    SubprojectSerializer,
    PhaseSerializer,
    AssetSerializer,
    TaskSerializer,
    WorkloadSerializer,
    WorkCategorySerializer,
)


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


class WorkloadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Workload.objects.all()
    serializer_class = WorkloadSerializer


class WorkCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkCategory.objects.all()
    serializer_class = WorkCategorySerializer

