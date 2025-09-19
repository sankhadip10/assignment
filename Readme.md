# Todo Application

This is a full-stack Todo application built with a Next.js frontend and a FastAPI backend. It provides a simple and intuitive interface for managing your daily tasks.

## Features

- **Create, Read, Update, Delete (CRUD)** operations for todos.
- **AI-Powered Daily Summary:** Get a quick, AI-generated overview of tasks that are due today, upcoming, or overdue.
- **Responsive Design:** A clean and modern user interface that works on all screen sizes.
- **Load Testing:** Comes with a pre-configured Locust load test suite to simulate user traffic.

## Technology Stack

- **Frontend:** [Next.js](https://nextjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/), [SQLite](https://www.sqlite.org/index.html)
- **AI:** [OpenAI](https://openai.com/), [Ollama](https://ollama.com/)
- **Testing:** [Jest](https://jestjs.io/) & [Cypress](https://www.cypress.io/) (Frontend), [pytest](https://docs.pytest.org/) (Backend), [Locust](https://locust.io/) (Load Testing)

## Project Structure

The project is organized into two main directories:

- `frontend/`: A Next.js application that provides the user interface.
- `backend/`: A FastAPI application that serves the API for managing todos.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later) and npm
- [Python](https://www.python.org/) (v3.13 or later) and pip

### Installation & Setup

**1. Backend Setup**

First, set up and run the backend server:

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt
```
This will also create a `test.db` file in the `backend` directory, which is the SQLite database.

**2. AI Configuration**

Create a `.env` file in the `backend` directory and add the following environment variables:

```
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

- `AI_PROVIDER`: The AI provider to use (`openai` or `ollama`).
- `OPENAI_API_KEY`: Your OpenAI API key.
- `OPENAI_API_BASE`: The base URL for the API. For Ollama, this would be `http://localhost:11434/v1`.
- `LLM_MODEL`: The model to use (e.g., `gpt-4o-mini` for OpenAI, `llama3` for Ollama).

**3. Frontend Setup**

Next, set up the frontend application:

```bash
# Navigate to the frontend directory
cd frontend

# Install the dependencies
npm install
```

### Running the Application

**1. Start the Backend Server**

With the virtual environment activated, run the following command from the `backend` directory:

```bash
uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000`.

**2. Start the Frontend Application**

In a separate terminal, run the following command from the `frontend` directory:

```bash
npm run dev
```
The frontend application will be running at `http://localhost:3000`.

---

## Your Assignment: Write the Tests!

Welcome, SDET candidate! Your task is to write a comprehensive suite of tests for this application. We've removed the existing tests to give you a blank canvas.

You will find empty test files in the `frontend` and `backend` directories. Your goal is to populate these files with high-quality tests that cover the application's functionality.

### Backend Testing (`/backend/tests/`)

Use `pytest` to write unit and integration tests for the FastAPI backend.

-   **`test_main.py`**: Write tests for the main application logic, including API endpoints.
    -   **Instructions**:
        -   Test the CRUD operations for todos (`/todos/`).
        -   Ensure that the API returns the correct status codes and response bodies.
        -   Test edge cases, such as creating a todo with missing data or updating a non-existent todo.
-   **`test_ai_summary.py`**: Write tests for the AI summary generation logic.
    -   **Hint**: This is a tougher one. You'll need to think about how to test the *quality* of the AI-generated summary. Consider the following:
        -   How can you verify that the summary accurately reflects the todos?
        -   How would you handle different scenarios, such as no todos, overdue todos, or a mix of both?
        -   Think about how you could use a mock LLM to control the AI's output and test different responses.
-   **`conftest.py`**: Set up any necessary fixtures for your tests, such as a test database.

### Frontend Testing (`/frontend/`)

Use Jest and Cypress to test the Next.js frontend.

-   **`src/app/__tests__/page.test.tsx`**: Write unit tests for the main page component.
    -   **Instructions**:
        -   Test that the component renders correctly.
        -   Mock the API calls to isolate the component's logic.
-   **`src/components/__tests__/TodoList.test.tsx`**: Write unit tests for the `TodoList` component.
    -   **Instructions**:
        -   Test that the component renders a list of todos correctly.
        -   Test the component's behavior when the user interacts with it (e.g., clicking the "delete" button).
-   **`cypress/e2e/app.cy.ts`**: Write end-to-end tests for the application.
    -   **Instructions**:
        -   Test the full user flow of creating, viewing, updating, and deleting a todo.
        -   Assert that the UI updates correctly after each action.

### Load Testing (`/backend/locustfile.py`)

The project includes a Locust load test.
-   **Hint**: Analyze the existing `locustfile.py`. Can you identify any potential performance bottlenecks? How would you modify the load test to simulate a more realistic user scenario?

Good luck! We're excited to see your work.

---

## API Documentation

The backend provides the following API endpoints.

### Todo Model

```json
{
  "id": 0,
  "title": "string",
  "description": "string",
  "completed": false,
  "created_at": "2025-09-01T12:00:00.000Z",
  "due_date": "2025-09-01T12:00:00.000Z"
}
```

### Endpoints

| Method | Endpoint              | Description                  | Request Body                 | Response Body              |
|--------|-----------------------|------------------------------|------------------------------|----------------------------|
| `POST` | `/todos/`             | Create a new todo.           | `Todo` (without `id`)        | `Todo` (with `id`)         |
| `GET`    | `/todos/`             | Get a list of all todos.     | -                            | `List[Todo]`               |
| `GET`    | `/todos/summary`      | Get a summary of todos.      | -                            | `string`                   |
| `GET`    | `/todos/{todo_id}`    | Get a specific todo by ID.   | -                            | `Todo`                     |
| `PUT`    | `/todos/{todo_id}`    | Update a specific todo.      | `Todo`                       | `Todo`                     |
| `DELETE` | `/todos/{todo_id}`    | Delete a specific todo.      | -                            | `Todo`                     |

---

## Frontend Components

The frontend is built with React and Next.js and includes the following components:

- **`AddTodo.tsx`**: A form for adding new todos.
- **`Todo.tsx`**: Displays a single todo item with options to edit and delete.
- **`TodoList.tsx`**: Renders the list of all todo items.
- **`Summary.tsx`**: Displays the AI-powered daily summary of todos.
