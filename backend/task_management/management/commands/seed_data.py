from django.core.management.base import BaseCommand

from task_management.models import Board, Column, Task


class Command(BaseCommand):
    help = "Seed TaskFlow database with sample data."

    def handle(self, *args, **options):

        board, _ = Board.objects.get_or_create(
            title="TaskFlow Demo Board"
        )

        columns = {}

        for column_type, _ in Column.ColumnType.choices:
            column, _ = Column.objects.get_or_create(
                board=board,
                title=column_type,
            )

            columns[column_type] = column

        Task.objects.get_or_create(
            column=columns[Column.ColumnType.TODO],
            title="Create project",
            defaults={
                "description": "Create the initial TaskFlow project.",
                "priority": Task.Priority.HIGH,
            },
        )

        Task.objects.get_or_create(
            column=columns[Column.ColumnType.IN_PROGRESS],
            title="Implement task API",
            defaults={
                "description": "Implement task creation and update APIs.",
                "priority": Task.Priority.MEDIUM,
            },
        )

        Task.objects.get_or_create(
            column=columns[Column.ColumnType.DONE],
            title="Setup database",
            defaults={
                "description": "Create database models and migrations.",
                "priority": Task.Priority.LOW,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                "TaskFlow seed data created successfully."
            )
        )   
