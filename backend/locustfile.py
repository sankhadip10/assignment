import random
from locust import HttpUser, task, between

class TodoUser(HttpUser):
    wait_time = between(1, 5)
    host = "http://localhost:8000"
    created_todos = []

    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        # Let's create some initial todos
        for i in range(5):
            title = f"Initial Todo {i}"
            res = self.client.post("/todos/", json={"title": title, "description": f"Description for {title}"})
            if res.status_code == 200:
                self.created_todos.append(res.json())

    @task(5) # Higher weight for getting all todos
    def get_todos(self):
        self.client.get("/todos/")

    @task(3)
    def create_todo(self):
        title = "Test Todo from Locust"
        res = self.client.post("/todos/", json={"title": title, "description": "This is a test todo."})
        if res.status_code == 200:
            self.created_todos.append(res.json())

    @task(2)
    def get_specific_todo(self):
        if not self.created_todos:
            return

        todo = random.choice(self.created_todos)
        self.client.get(f"/todos/{todo['id']}", name="/todos/[id]")


    @task(1)
    def update_todo(self):
        if not self.created_todos:
            return

        todo = random.choice(self.created_todos)
        todo_id = todo['id']
        updated_data = {
            "title": f"Updated Title for {todo_id}",
            "description": f"Updated description.",
            "completed": True
        }
        self.client.put(f"/todos/{todo_id}", json=updated_data, name="/todos/[id]")

    @task(1)
    def delete_todo(self):
        if not self.created_todos:
            return

        todo = random.choice(self.created_todos)
        todo_id = todo['id']
        res = self.client.delete(f"/todos/{todo_id}", name="/todos/[id]")
        if res.status_code == 200:
            # Remove from our list
            self.created_todos = [t for t in self.created_todos if t['id'] != todo_id]