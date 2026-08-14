from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

from .models import Board, Column, Task


def make_board(title="Test Board"):
    """Helper: create a Board with all three columns (like BoardSerializer does)."""
    board = Board.objects.create(title=title)
    for col_type, _ in Column.ColumnType.choices:
        Column.objects.create(board=board, title=col_type)
    return board


def get_column(board, col_title):
    return board.columns.get(title=col_title)


# ── Test 1: Empty title is rejected ─────────────────────────
class TaskValidationTests(APITestCase):
    def setUp(self):
        self.board = make_board()
        self.todo_col = get_column(self.board, "ToDo")

    def test_create_task_with_no_title_fails(self):
        """POST /api/tasks/ with an empty title must return 400."""
        url = reverse("task-list-create")
        payload = {
            "title": "",
            "priority": "medium",
            "column": self.todo_col.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_create_task_with_missing_title_fails(self):
        """POST /api/tasks/ with no title field at all must also return 400."""
        url = reverse("task-list-create")
        payload = {"priority": "high", "column": self.todo_col.id}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_with_valid_title_succeeds(self):
        """POST /api/tasks/ with a proper title must return 201."""
        url = reverse("task-list-create")
        payload = {
            "title": "Write unit tests",
            "priority": "high",
            "column": self.todo_col.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Write unit tests")


# ── Test 2: Moving a task updates its column ─────────────────
class TaskMoveTests(APITestCase):
    def setUp(self):
        self.board = make_board()
        self.todo_col      = get_column(self.board, "ToDo")
        self.progress_col  = get_column(self.board, "InProgress")
        self.done_col      = get_column(self.board, "Done")
        self.task = Task.objects.create(
            column=self.todo_col,
            title="A movable task",
            priority="medium",
        )

    def test_move_task_to_in_progress(self):
        """PATCH /api/tasks/<id>/ with a new column id must update the column."""
        url = reverse("task-detail", kwargs={"pk": self.task.id})
        response = self.client.patch(
            url, {"column": self.progress_col.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["column"], self.progress_col.id)
        self.assertEqual(response.data["column_name"], "InProgress")

        # Confirm persisted in DB
        self.task.refresh_from_db()
        self.assertEqual(self.task.column_id, self.progress_col.id)

    def test_move_task_to_done(self):
        """Moving from ToDo straight to Done should also work."""
        url = reverse("task-detail", kwargs={"pk": self.task.id})
        response = self.client.patch(
            url, {"column": self.done_col.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["column_name"], "Done")


# ── Test 3: Database-layer query — filter by priority ────────
class TaskQueryTests(TestCase):
    """
    Hits the database through the ORM (which issues the SQL in schema.sql Query 2).
    Verifies the priority filter returns the right rows for known seed data.
    """

    def setUp(self):
        self.board = make_board()
        self.todo = get_column(self.board, "ToDo")
        Task.objects.create(column=self.todo, title="High task 1", priority="high")
        Task.objects.create(column=self.todo, title="High task 2", priority="high")
        Task.objects.create(column=self.todo, title="Medium task", priority="medium")
        Task.objects.create(column=self.todo, title="Low task",    priority="low")

    def test_tasks_by_priority_returns_correct_rows(self):
        """
        Mirrors the backend filter:
          SELECT ... FROM tasks WHERE priority = 'high' ORDER BY created_at DESC
        Only high-priority tasks should come back, newest first.
        """
        high_tasks = (
            Task.objects
            .select_related("column", "column__board")
            .filter(priority="high")
            .order_by("-created_at")
        )
        self.assertEqual(high_tasks.count(), 2)
        for t in high_tasks:
            self.assertEqual(t.priority, "high")

    def test_task_count_per_column_query(self):
        """
        Mirrors the backend count query:
          SELECT c.title, COUNT(t.id) FROM columns LEFT JOIN tasks GROUP BY c.id
        """
        from django.db.models import Count
        columns = (
            Column.objects
            .filter(board=self.board)
            .annotate(task_count=Count("tasks"))
        )
        counts = {c.title: c.task_count for c in columns}
        # All 4 tasks are in the ToDo column
        self.assertEqual(counts.get("ToDo"), 4)
        self.assertEqual(counts.get("InProgress"), 0)
        self.assertEqual(counts.get("Done"), 0)

    def test_tasks_ordered_newest_first(self):
        """Newest task should come first when ordered by -created_at."""
        latest = Task.objects.filter(priority="high").order_by("-created_at").first()
        self.assertEqual(latest.title, "High task 2")
