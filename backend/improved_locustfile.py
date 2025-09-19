import random
import time
from locust import HttpUser, task, between
from locust.exception import StopUser


class ImprovedTodoUser(HttpUser):
    wait_time = between(1, 3)  # More realistic wait times
    host = "http://localhost:8000"
    created_todos = []
    max_todos_per_user = 10  # Prevent memory issues

    def on_start(self):
        """Initialize user with some todos"""
        # Create fewer initial todos to reduce database load
        initial_todo_count = random.randint(2, 5)
        for i in range(initial_todo_count):
            self.create_todo_helper(f"Initial Todo {i} - User {self.user_id}")

    def on_stop(self):
        """Cleanup user's todos when stopping"""
        for todo in self.created_todos[:]:
            try:
                response = self.client.delete(f"/todos/{todo['id']}")
                if response.status_code == 200:
                    self.created_todos.remove(todo)
            except Exception:
                pass  # Ignore cleanup errors

    @property
    def user_id(self):
        """Generate unique user ID based on current time and random"""
        if not hasattr(self, '_user_id'):
            self._user_id = f"{int(time.time())}{random.randint(1000, 9999)}"
        return self._user_id

    def create_todo_helper(self, title, description=None):
        """Helper method to create todos"""
        payload = {"title": title}
        if description:
            payload["description"] = description

        with self.client.post("/todos/", json=payload, catch_response=True) as response:
            if response.status_code == 200:
                todo = response.json()
                if len(self.created_todos) < self.max_todos_per_user:
                    self.created_todos.append(todo)
                return todo
            else:
                response.failure(f"Failed to create todo: {response.status_code}")
                return None

    @task(10)  # Increased weight for most common operation
    def get_all_todos(self):
        """Get all todos - most frequent operation"""
        with self.client.get("/todos/", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get todos: {response.status_code}")

    @task(2)
    def create_todo(self):
        """Create a new todo"""
        if len(self.created_todos) >= self.max_todos_per_user:
            return  # Skip if user has too many todos

        title = f"Load Test Todo - {random.randint(1, 10000)}"
        description = f"Created by load test at {time.strftime('%Y-%m-%d %H:%M:%S')}"
        self.create_todo_helper(title, description)

    @task(3)
    def get_specific_todo(self):
        """Get a specific todo by ID"""
        if not self.created_todos:
            return

        todo = random.choice(self.created_todos)
        with self.client.get(f"/todos/{todo['id']}", name="/todos/[id]", catch_response=True) as response:
            if response.status_code == 404:
                # Todo was deleted by another user, remove from our list
                if todo in self.created_todos:
                    self.created_todos.remove(todo)
                response.success()  # This is expected behavior
            elif response.status_code != 200:
                response.failure(f"Failed to get todo: {response.status_code}")

    @task(2)
    def update_todo(self):
        """Update an existing todo"""
        if not self.created_todos:
            return

        todo = random.choice(self.created_todos)
        updated_data = {
            "title": f"Updated: {todo['title']}",
            "description": f"Updated at {time.strftime('%H:%M:%S')}",
            "completed": random.choice([True, False])
        }

        with self.client.put(f"/todos/{todo['id']}", json=updated_data, name="/todos/[id]",
                             catch_response=True) as response:
            if response.status_code == 404:
                # Todo was deleted, remove from our list
                if todo in self.created_todos:
                    self.created_todos.remove(todo)
                response.success()  # Expected behavior
            elif response.status_code == 200:
                # Update our local copy
                updated_todo = response.json()
                index = self.created_todos.index(todo)
                self.created_todos[index] = updated_todo
            else:
                response.failure(f"Failed to update todo: {response.status_code}")

    @task(1)
    def delete_todo(self):
        """Delete a todo"""
        if not self.created_todos:
            return

        todo = random.choice(self.created_todos)
        with self.client.delete(f"/todos/{todo['id']}", name="/todos/[id]", catch_response=True) as response:
            if response.status_code == 200:
                self.created_todos.remove(todo)
            elif response.status_code == 404:
                # Already deleted, remove from our list
                if todo in self.created_todos:
                    self.created_todos.remove(todo)
                response.success()  # Expected behavior
            else:
                response.failure(f"Failed to delete todo: {response.status_code}")

    @task(1)
    def get_summary(self):
        """Get AI summary - expensive operation with lower weight"""
        with self.client.get("/todos/summary", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get summary: {response.status_code}")
            # Check if response time is reasonable (summary can be slow due to AI API)
            elif response.elapsed.total_seconds() > 30:
                response.failure("Summary request took too long")
