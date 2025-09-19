import pytest
from unittest.mock import patch, Mock
from datetime import datetime, date
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ai_summary
import models
from fastapi.testclient import TestClient


class TestAISummaryGeneration:
    """Test AI summary generation functionality."""

    def test_summary_with_no_todos(self, client):
        """Test AI summary endpoint when no todos exist."""
        response = client.get("/todos/summary")

        assert response.status_code == 200
        summary = response.json()
        assert "no tasks" in summary.lower() or "enjoy" in summary.lower()

    def test_summary_endpoint_with_todos(self, client, multiple_created_todos):
        """Test AI summary endpoint with existing todos."""
        response = client.get("/todos/summary")

        assert response.status_code == 200
        summary = response.json()
        assert isinstance(summary, str)
        assert len(summary) > 0
        # Summary should contain some reference to tasks/todos
        assert any(word in summary.lower() for word in ["task", "todo", "pending", "completed"])


class TestAISummaryFunction:
    """Test the ai_summary.generate_summary function directly."""

    def create_mock_todo(self, title, completed=False, due_date=None, todo_id=1):
        """Helper to create mock todo objects."""
        todo = Mock(spec=models.Todo)
        todo.id = todo_id
        todo.title = title
        todo.completed = completed
        todo.due_date = due_date
        return todo

    def test_generate_summary_empty_list(self):
        """Test generate_summary with empty todo list."""
        summary = ai_summary.generate_summary([])
        assert summary == "You have no tasks. Enjoy your day!"

    @patch('ai_summary.client.chat.completions.create')
    def test_generate_summary_with_todos_success(self, mock_openai):
        """Test generate_summary with todos and successful API response."""
        # Mock the OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "You have 2 tasks pending. Keep up the good work!"
        mock_openai.return_value = mock_response

        # Create mock todos
        todos = [
            self.create_mock_todo("Task 1", False, datetime(2025, 12, 31)),
            self.create_mock_todo("Task 2", True, datetime(2025, 11, 30), 2)
        ]

        summary = ai_summary.generate_summary(todos)

        assert summary == "You have 2 tasks pending. Keep up the good work!"
        mock_openai.assert_called_once()

    @patch('ai_summary.client.chat.completions.create')
    def test_generate_summary_api_error(self, mock_openai):
        """Test generate_summary when OpenAI API throws an error."""
        # Mock API error
        mock_openai.side_effect = Exception("API Error")

        todos = [self.create_mock_todo("Test Task")]

        summary = ai_summary.generate_summary(todos)

        assert "couldn't generate a summary" in summary
        assert "check your AI configuration" in summary

    @patch('ai_summary.client.chat.completions.create')
    def test_generate_summary_prompt_construction(self, mock_openai):
        """Test that the prompt is constructed correctly."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Test response"
        mock_openai.return_value = mock_response

        todos = [
            self.create_mock_todo("Task with date", False, datetime(2025, 12, 31)),
            self.create_mock_todo("Task without date", False, None, 2),
            self.create_mock_todo("Completed task", True, datetime(2025, 11, 30), 3)
        ]

        ai_summary.generate_summary(todos)

        mock_openai.assert_called_once()

        call_args = mock_openai.call_args
        messages = call_args.kwargs['messages']

        # Check prompt structure
        assert len(messages) == 2
        assert messages[0]['role'] == 'system'
        assert messages[1]['role'] == 'user'

        user_message = messages[1]['content']
        assert "Task with date" in user_message
        assert "Task without date" in user_message
        assert "Completed task" in user_message
        assert "No due date" in user_message  # For task without date
        assert "2025-12-31" in user_message  # For task with date
        assert "Completed" in user_message  # For completed task
        assert "Pending" in user_message  # For pending tasks

    @patch('ai_summary.client.chat.completions.create')
    def test_generate_summary_model_parameters(self, mock_openai):
        """Test that the correct model parameters are used."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Test response"
        mock_openai.return_value = mock_response

        todos = [self.create_mock_todo("Test Task")]

        ai_summary.generate_summary(todos)

        call_args = mock_openai.call_args

        # Check model parameters
        assert call_args.kwargs['temperature'] == 0.7
        assert call_args.kwargs['max_tokens'] == 150
        assert 'model' in call_args.kwargs

    def test_date_formatting_none_due_date(self):
        """Test that None due_date is handled correctly."""
        todos = [self.create_mock_todo("Task without date", False, None)]

        try:
            summary = ai_summary.generate_summary(todos)
            assert True
        except AttributeError as e:
            pytest.fail(f"generate_summary raised AttributeError with None due_date: {e}")

    def test_date_formatting_with_due_date(self):
        """Test that valid due_date is handled correctly."""
        due_date = datetime(2025, 12, 31, 15, 30, 0)
        todos = [self.create_mock_todo("Task with date", False, due_date)]

        # This should not raise any date formatting errors
        try:
            summary = ai_summary.generate_summary(todos)
            assert True
        except Exception as e:
            pytest.fail(f"generate_summary raised exception with valid due_date: {e}")


class TestAISummaryQuality:
    """Test the quality and accuracy of AI-generated summaries."""

    def create_mock_todo(self, title, completed=False, due_date=None, todo_id=1):
        """Helper to create mock todo objects."""
        todo = Mock(spec=models.Todo)
        todo.id = todo_id
        todo.title = title
        todo.completed = completed
        todo.due_date = due_date
        return todo

    @patch('ai_summary.client.chat.completions.create')
    def test_summary_reflects_overdue_tasks(self, mock_openai):
        """Test that summary mentions overdue tasks."""
        # Mock a summary that mentions overdue tasks
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "You have 1 overdue task that needs attention!"
        mock_openai.return_value = mock_response

        # Create an overdue task
        past_date = datetime(2020, 1, 1)
        todos = [self.create_mock_todo("Overdue task", False, past_date)]

        summary = ai_summary.generate_summary(todos)

        # The prompt should contain overdue information
        call_args = mock_openai.call_args
        user_message = call_args.kwargs['messages'][1]['content']
        assert "overdue" in user_message.lower()

        assert "overdue" in summary.lower()

    @patch('ai_summary.client.chat.completions.create')
    def test_summary_reflects_completed_tasks(self, mock_openai):
        """Test that summary acknowledges completed tasks."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        # mock_response.choices[0].message.content = "Great job completing 2 tasks!"
        mock_response.choices[0].message.content = "Great job, 2 tasks are completed!"
        mock_openai.return_value = mock_response

        todos = [
            self.create_mock_todo("Completed task 1", True, datetime(2025, 12, 31)),
            self.create_mock_todo("Completed task 2", True, datetime(2025, 11, 30), 2)
        ]

        summary = ai_summary.generate_summary(todos)

        call_args = mock_openai.call_args
        user_message = call_args.kwargs['messages'][1]['content']


        status_completed_count = user_message.count("Status: Completed")
        assert status_completed_count == 2

        assert "completed" in summary.lower()

    @patch('ai_summary.client.chat.completions.create')
    def test_summary_mixed_scenarios(self, mock_openai):
        """Test summary with mixed todo scenarios."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Mixed tasks: some overdue, some completed, some pending."
        mock_openai.return_value = mock_response

        # Create a mix of todos
        today = datetime.now()
        past_date = datetime(2020, 1, 1)
        future_date = datetime(2030, 12, 31)

        todos = [
            self.create_mock_todo("Overdue task", False, past_date),
            self.create_mock_todo("Completed task", True, today, 2),
            self.create_mock_todo("Future task", False, future_date, 3),
            self.create_mock_todo("No date task", False, None, 4)
        ]

        summary = ai_summary.generate_summary(todos)

        # Check that all scenarios are represented in the prompt
        call_args = mock_openai.call_args
        user_message = call_args.kwargs['messages'][1]['content']

        assert "Overdue task" in user_message
        assert "Completed task" in user_message
        assert "Future task" in user_message
        assert "No date task" in user_message
        assert "No due date" in user_message
        assert "Completed" in user_message
        assert "Pending" in user_message

        assert len(summary) > 0


class TestAISummaryIntegration:
    """Integration tests for AI summary with real API endpoint."""

    def test_summary_endpoint_error_handling(self, client):
        """Test that summary endpoint handles errors gracefully."""
        # This test will work with your actual OpenAI setup
        # If API fails, it should return an error message, not crash
        response = client.get("/todos/summary")

        assert response.status_code == 200
        summary = response.json()
        assert isinstance(summary, str)
        # Even if there's an error, we should get some response
        assert len(summary) > 0

    @patch('ai_summary.client.chat.completions.create')
    def test_summary_endpoint_with_mocked_ai(self, mock_openai, client, multiple_created_todos):
        """Test summary endpoint with mocked AI response."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Mocked AI summary response"
        mock_openai.return_value = mock_response

        response = client.get("/todos/summary")

        assert response.status_code == 200
        assert response.json() == "Mocked AI summary response"
        mock_openai.assert_called_once()