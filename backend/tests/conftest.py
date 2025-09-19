import pytest
import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, get_db
from database import Base
import models


@pytest.fixture
def test_db():
    """Create a test database."""
    db_fd, db_path = tempfile.mkstemp()
    database_url = f"sqlite:///{db_path}"

    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestingSessionLocal

    os.close(db_fd)
    os.unlink(db_path)
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_db):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def sample_todo_data():
    """Sample todo data for testing."""
    return {
        "title": "Test Todo",
        "description": "This is a test todo",
        "completed": False,
        "due_date": "2025-12-31T23:59:59.000Z"
    }


@pytest.fixture
def sample_todos_data():
    """Multiple sample todos for testing."""
    return [
        {
            "title": "Todo 1",
            "description": "First test todo",
            "completed": False,
            "due_date": "2025-01-01T12:00:00.000Z"
        },
        {
            "title": "Todo 2",
            "description": "Second test todo",
            "completed": True,
            "due_date": "2025-02-01T12:00:00.000Z"
        },
        {
            "title": "Todo 3",
            "description": "Third test todo",
            "completed": False,
            "due_date": None
        }
    ]


@pytest.fixture
def created_todo(client, sample_todo_data):
    """Create a todo and return its data."""
    response = client.post("/todos/", json=sample_todo_data)
    return response.json()


@pytest.fixture
def multiple_created_todos(client, sample_todos_data):
    """Create multiple todos and return their data."""
    created_todos = []
    for todo_data in sample_todos_data:
        response = client.post("/todos/", json=todo_data)
        created_todos.append(response.json())
    return created_todos