"""Serializers for API models."""

from rest_framework import serializers

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


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = "__all__"


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = "__all__"


class SubprojectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subproject
        fields = "__all__"


class PhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Phase
        fields = "__all__"


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"

class PersonWorkloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonWorkload
        fields = "__all__"


class PMMWorkloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PMMWorkload
        fields = "__all__"


class WorkCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCategory
        fields = "__all__"

