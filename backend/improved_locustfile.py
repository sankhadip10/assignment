import random
from locust import HttpUser, task, between

class TodoUser(HttpUser):
    wait_time = between(3, 10)  # more realistic think time
    host = "http://localhost:8000"
    created_todos = []

    def on_start(self):
        # Seed a few todos
        for i in range(3):
            res = self.client.post("/todos/", json={"title": f"Seed {i}", "description": f"Desc {i}"})
            if res.status_code == 200:
                self.created_todos.append(res.json())

    @task(4)
    def list_todos(self):
        self.client.get("/todos/")

    @task(2)
    def create_todo(self):
        res = self.client.post("/todos/", json={"title": "LoadTest Todo", "description": "Generated"})
        if res.status_code == 200:
            self.created_todos.append(res.json())
            # cap size
            if len(self.created_todos) > 50:
                self.created_todos.pop(0)

    @task(1)
    def get_specific(self):
        if self.created_todos:
            todo = random.choice(self.created_todos)
            self.client.get(f"/todos/{todo['id']}", name="/todos/[id]")

    @task(1)
    def update_todo(self):
        if self.created_todos:
            todo = random.choice(self.created_todos)
            self.client.put(f"/todos/{todo['id']}", json={"title": "Updated", "description": "Updated desc", "completed": True}, name="/todos/[id]")

    @task(1)
    def delete_todo(self):
        if self.created_todos:
            todo = random.choice(self.created_todos)
            res = self.client.delete(f"/todos/{todo['id']}", name="/todos/[id]")
            if res.status_code == 200:
                self.created_todos = [t for t in self.created_todos if t['id'] != todo['id']]

    @task(1)
    def get_summary(self):
        self.client.get("/todos/summary")
