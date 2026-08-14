from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


from .models import Column, Task
from .serializers import TaskSerializer


class TaskListCreateAPIView(APIView):

    def get(self, request):
        tasks = Task.objects.select_related("column", "column__board").all()

        # ?search=  — case-insensitive match on title or description
        search = request.query_params.get("search", "").strip()
        if search:
            tasks = tasks.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # ?priority=low|medium|high
        priority = request.query_params.get("priority", "").strip()
        if priority:
            tasks = tasks.filter(priority=priority)

        # ?board_id=<int>
        board_id = request.query_params.get("board_id", "").strip()
        if board_id:
            tasks = tasks.filter(column__board_id=board_id)

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            task = serializer.save()

            return Response(
                TaskSerializer(task).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class TaskDetailAPIView(APIView):

    def get(self, request, pk):
        task = get_object_or_404(
            Task.objects.select_related(
                "column",
                "column__board",
            ),
            pk=pk,
        )

        serializer = TaskSerializer(task)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = TaskSerializer(
            task,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            task = serializer.save()

            return Response(
                TaskSerializer(task).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        task.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )
        


        
        
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Board, Task
from .serializers import BoardSerializer, TaskSerializer


class BoardListCreateAPIView(APIView):

    def get(self, request):
        boards = Board.objects.prefetch_related("columns").all()
        serializer = BoardSerializer(boards, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = BoardSerializer(data=request.data)

        if serializer.is_valid():
            board = serializer.save()

            return Response(
                BoardSerializer(board).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class BoardDetailAPIView(APIView):

    def get(self, request, pk):
        board = get_object_or_404(
            Board.objects.prefetch_related("columns"),
            pk=pk,
        )

        serializer = BoardSerializer(board)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    
    
class BoardTaskCountAPIView(APIView):

    def get(self, request, board_id=1):
        board = get_object_or_404(Board, id=board_id)

        columns = (
            Column.objects
            .filter(board=board)
            .annotate(task_count=Count("tasks"))
        )

        counts = {
            "ToDo": 0,
            "InProgress": 0,
            "Done": 0,
        }

        for column in columns:
            counts[column.title] = column.task_count

        return Response(
            {
                "board_id": board.id,
                "board_name": board.title,
                "task_counts": counts,
            },
            status=status.HTTP_200_OK,
        )