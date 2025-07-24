"""Serializers for API models."""

from rest_framework import serializers

from .models import (
    Person,
    Subproject,
    Phase,
    Asset,
    Task,
    Workload,
    WorkCategory,
)


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


class WorkloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workload
        fields = "__all__"


class WorkCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCategory
        fields = "__all__"

