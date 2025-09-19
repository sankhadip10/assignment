import pytest
from datetime import datetime
from fastapi.testclient import TestClient


class TestRootEndpoint:
    """Test the root endpoint."""

    def test_read_root(self, client):
        """Test the root endpoint returns Hello World."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"Hello": "World"}


class TestTodosCRUD:
    """Test CRUD operations for todos"""

    def test_create_todo_success(self, client, sample_todo_data):
        """Test creating a todo successfully."""
        response = client.post("/todos/", json=sample_todo_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == sample_todo_data["title"]
        assert data["description"] == sample_todo_data["description"]
        assert data["completed"] == sample_todo_data["completed"]
        assert "id" in data
        assert "created_at" in data
        assert data["due_date"] == sample_todo_data["due_date"]

    def test_create_todo_minimal_data(self, client):
        """Test creating a todo with minimal required data."""
        minimal_todo = {"title": "Minimal Todo"}
        response = client.post("/todos/", json=minimal_todo)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Minimal Todo"
        assert data["description"] is None
        assert data["completed"] == False
        assert data["due_date"] is None
        assert "id" in data
        assert "created_at" in data

    def test_create_todo_missing_title(self, client):
        """Test creating a todo without required title field."""
        invalid_todo = {"description": "No title todo"}
        response = client.post("/todos/", json=invalid_todo)

        assert response.status_code == 422  # Validation error
        assert "detail" in response.json()

    def test_create_todo_invalid_data_types(self, client):
        """Test creating a todo with invalid data types."""
        invalid_todo = {
            "title": 123,  # Should be string
            "completed": "yes",  # Should be boolean
            "due_date": "invalid-date"  # Should be valid datetime
        }
        response = client.post("/todos/", json=invalid_todo)
        assert response.status_code == 422

    def test_get_all_todos_empty(self, client):
        """Test getting all todos when database is empty."""
        response = client.get("/todos/")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_all_todos_with_data(self, client, multiple_created_todos):
        """Test getting all todos when there are todos in database."""
        response = client.get("/todos/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all("id" in todo for todo in data)
        assert all("title" in todo for todo in data)

    def test_get_todo_by_id_success(self, client, created_todo):
        """Test getting a specific todo by ID."""
        todo_id = created_todo["id"]
        response = client.get(f"/todos/{todo_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == todo_id
        assert data["title"] == created_todo["title"]

    def test_get_todo_by_id_not_found(self, client):
        """Test getting a todo that doesn't exist."""
        response = client.get("/todos/999")

        assert response.status_code == 404
        assert response.json()["detail"] == "Todo not found"

    def test_get_todo_by_invalid_id(self, client):
        """Test getting a todo with invalid ID format."""
        response = client.get("/todos/invalid")

        assert response.status_code == 422  # Validation error

    def test_update_todo_success(self, client, created_todo):
        """Test updating a todo successfully."""
        todo_id = created_todo["id"]
        update_data = {
            "title": "Updated Todo",
            "description": "Updated description",
            "completed": True,
            "due_date": "2025-12-25T12:00:00.000Z"
        }

        response = client.put(f"/todos/{todo_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == todo_id
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["completed"] == update_data["completed"]
        assert data["due_date"] == update_data["due_date"]

    def test_update_todo_partial(self, client, created_todo):
        """Test partial update of a todo."""
        todo_id = created_todo["id"]
        update_data = {"completed": True}

        response = client.put(f"/todos/{todo_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] == True
        # Other fields should remain unchanged
        assert data["title"] == created_todo["title"]

    def test_update_todo_not_found(self, client):
        """Test updating a todo that doesn't exist."""
        update_data = {"title": "Updated Todo"}
        response = client.put("/todos/999", json=update_data)

        assert response.status_code == 404
        assert response.json()["detail"] == "Todo not found"

    def test_update_todo_invalid_data(self, client, created_todo):
        """Test updating a todo with invalid data."""
        todo_id = created_todo["id"]
        invalid_data = {"title": None}  # Title should not be None

        response = client.put(f"/todos/{todo_id}", json=invalid_data)
        assert response.status_code == 422

    def test_delete_todo_success(self, client, created_todo):
        """Test deleting a todo successfully."""
        todo_id = created_todo["id"]

        response = client.delete(f"/todos/{todo_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == todo_id

        # Verify todo is actually deleted
        get_response = client.get(f"/todos/{todo_id}")
        assert get_response.status_code == 404

    def test_delete_todo_not_found(self, client):
        """Test deleting a todo that doesn't exist."""
        response = client.delete("/todos/999")

        assert response.status_code == 404
        assert response.json()["detail"] == "Todo not found"

    def test_delete_todo_invalid_id(self, client):
        """Test deleting a todo with invalid ID format."""
        response = client.delete("/todos/invalid")

        assert response.status_code == 422


class TestTodosWorkflow:
    """Test complete workflows with todos."""

    def test_complete_todo_workflow(self, client):
        """Test complete CRUD workflow for a todo."""
        # Create
        create_data = {
            "title": "Workflow Test Todo",
            "description": "Testing complete workflow",
            "completed": False
        }
        create_response = client.post("/todos/", json=create_data)
        assert create_response.status_code == 200
        todo_id = create_response.json()["id"]

        # Read
        read_response = client.get(f"/todos/{todo_id}")
        assert read_response.status_code == 200
        assert read_response.json()["title"] == create_data["title"]

        # Update
        update_data = {
            "title": "Updated Workflow Todo",
            "description": "Updated description",
            "completed": True
        }
        update_response = client.put(f"/todos/{todo_id}", json=update_data)
        assert update_response.status_code == 200
        assert update_response.json()["completed"] == True

        # Delete
        delete_response = client.delete(f"/todos/{todo_id}")
        assert delete_response.status_code == 200

        # Verify deletion
        final_read_response = client.get(f"/todos/{todo_id}")
        assert final_read_response.status_code == 404

    def test_multiple_todos_operations(self, client):
        """Test operations with multiple todos."""
        # Create multiple todos
        todos = []
        for i in range(3):
            create_data = {"title": f"Todo {i + 1}"}
            response = client.post("/todos/", json=create_data)
            assert response.status_code == 200
            todos.append(response.json())

        # Get all todos
        all_response = client.get("/todos/")
        assert all_response.status_code == 200
        assert len(all_response.json()) == 3

        # Update one todo
        update_response = client.put(f"/todos/{todos[1]['id']}",
                                     json={"title": "Updated Todo 2", "completed": True})
        assert update_response.status_code == 200

        # Delete one todo
        delete_response = client.delete(f"/todos/{todos[0]['id']}")
        assert delete_response.status_code == 200

        # Verify final state
        final_response = client.get("/todos/")
        assert final_response.status_code == 200
        assert len(final_response.json()) == 2


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_extremely_long_title(self, client):
        """Test creating a todo with extremely long title."""
        long_title = "x" * 1000  # Very long title
        todo_data = {"title": long_title}
        response = client.post("/todos/", json=todo_data)

        # Should either accept it or return validation error
        assert response.status_code in [200, 422]

    def test_special_characters_in_title(self, client):
        """Test creating todo with special characters."""
        special_todo = {
            "title": "Todo with émojis 🎉 and spëcial chars: @#$%^&*()",
            "description": "Testing unicode: こんにちは世界 🌍"
        }
        response = client.post("/todos/", json=special_todo)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == special_todo["title"]
        assert data["description"] == special_todo["description"]

    def test_future_and_past_dates(self, client):
        """Test todos with various date scenarios."""
        past_date = "2020-01-01T12:00:00.000Z"
        future_date = "2030-12-31T23:59:59.000Z"

        todos = [
            {"title": "Past Due", "due_date": past_date},
            {"title": "Future Due", "due_date": future_date}
        ]

        for todo in todos:
            response = client.post("/todos/", json=todo)
            assert response.status_code == 200
            assert response.json()["due_date"] == todo["due_date"]