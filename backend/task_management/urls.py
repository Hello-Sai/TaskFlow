from django.urls import path

from .views import (
    BoardListCreateAPIView,
    BoardDetailAPIView,
    BoardTaskCountAPIView,
    TaskListCreateAPIView,
    TaskDetailAPIView,
)


urlpatterns = [
    # Boards
    path(
        "boards/",
        BoardListCreateAPIView.as_view(),
        name="board-list-create",
    ),
    path(
        "boards/<int:pk>/",
        BoardDetailAPIView.as_view(),
        name="board-detail",
    ),

    # Tasks
    path(
        "tasks/",
        TaskListCreateAPIView.as_view(),
        name="task-list-create",
    ),
    path(
        "tasks/<int:pk>/",
        TaskDetailAPIView.as_view(),
        name="task-detail",
    ),
    path(
        "boards/<int:board_id>/task-counts/",
        BoardTaskCountAPIView.as_view(),
        name="board-task-counts",
    ),
]
