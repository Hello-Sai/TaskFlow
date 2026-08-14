from django.db import models


class Board(models.Model):
    title = models.CharField(max_length=255)

    class Meta:
        db_table = "boards"

    def __str__(self):
        return self.title


class Column(models.Model):
    class ColumnType(models.TextChoices):
        TODO = "ToDo", "To Do"
        IN_PROGRESS = "InProgress", "In Progress"
        DONE = "Done", "Done"

    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="columns",
    )

    title = models.CharField(
        max_length=50,
        choices=ColumnType.choices,
    )

    class Meta:
        db_table = "columns"
        constraints = [
            models.UniqueConstraint(
                fields=["board", "title"],
                name="unique_column_per_board",
            )
        ]

    def __str__(self):
        return f"{self.board.title} - {self.title}"


class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    column = models.ForeignKey(
        Column,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
        null=True,
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "tasks"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
