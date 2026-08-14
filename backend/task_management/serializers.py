from rest_framework import serializers

from .models import Board, Column, Task


class ColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = [
            "id",
            "title",
        ]


class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = [
            "id",
            "title",
            "columns",
        ]
        read_only_fields = [
            "id",
            "columns",
        ]

    def create(self, validated_data):
        board = Board.objects.create(**validated_data)

        for column_type, _ in Column.ColumnType.choices:
            Column.objects.create(
                board=board,
                title=column_type,
            )

        return board


class TaskSerializer(serializers.ModelSerializer):
    column_name = serializers.CharField(
        source="column.title",
        read_only=True,
    )

    board_id = serializers.IntegerField(
        source="column.board.id",
        read_only=True,
    )

    board_name = serializers.CharField(
        source="column.board.title",
        read_only=True,
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "column",
            "column_name",
            "board_id",
            "board_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "column_name",
            "board_id",
            "board_name",
            "created_at",
            "updated_at",
        ]
