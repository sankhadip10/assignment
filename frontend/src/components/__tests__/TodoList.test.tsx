import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TodoList from '../TodoList';

// Mock AddTodo component
jest.mock('../AddTodo', () => {
  return function MockAddTodo({ onAdd }: { onAdd: (title: string, description: string) => void }) {
    return (
      <div data-testid="add-todo">
        <button 
          onClick={() => onAdd('Test Todo', 'Test Description')}
          data-testid="mock-add-button"
        >
          Add Todo Mock
        </button>
      </div>
    );
  };
});

// Mock Todo component
jest.mock('../Todo', () => {
  return function MockTodo({ 
    todo, 
    onUpdate, 
    onDelete 
  }: { 
    todo: any, 
    onUpdate: (todo: any) => void, 
    onDelete: (id: number) => void 
  }) {
    return (
      <div data-testid={`todo-${todo.id}`}>
        <span data-testid={`todo-title-${todo.id}`}>{todo.title}</span>
        <span data-testid={`todo-description-${todo.id}`}>{todo.description}</span>
        <span data-testid={`todo-completed-${todo.id}`}>{todo.completed.toString()}</span>
        <button 
          onClick={() => onUpdate({ ...todo, completed: !todo.completed })}
          data-testid={`update-button-${todo.id}`}
        >
          Update
        </button>
        <button 
          onClick={() => onDelete(todo.id)}
          data-testid={`delete-button-${todo.id}`}
        >
          Delete
        </button>
      </div>
    );
  };
});

// Mock fetch globally
global.fetch = jest.fn();
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockTodos = [
  {
    id: 1,
    title: 'Test Todo 1',
    description: 'Test Description 1',
    completed: false,
    created_at: '2023-01-01T00:00:00Z',
    due_date: '2023-12-31T23:59:59Z'
  },
  {
    id: 2,
    title: 'Test Todo 2',
    description: 'Test Description 2',
    completed: true,
    created_at: '2023-01-02T00:00:00Z',
    due_date: null
  }
];

describe('TodoList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering and Data Fetching', () => {
    it('renders without crashing', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      expect(screen.getByTestId('add-todo')).toBeInTheDocument();
    });

    it('fetches and displays todos on mount', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/');
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-1')).toBeInTheDocument();
        expect(screen.getByTestId('todo-2')).toBeInTheDocument();
      });

      expect(screen.getByTestId('todo-title-1')).toHaveTextContent('Test Todo 1');
      expect(screen.getByTestId('todo-title-2')).toHaveTextContent('Test Todo 2');
    });

    it('handles empty todo list', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/');
      });

      expect(screen.queryByTestId('todo-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('add-todo')).toBeInTheDocument();
    });

    it('handles fetch error gracefully', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/');
      });

      // Component should still render AddTodo even if fetch fails
      expect(screen.getByTestId('add-todo')).toBeInTheDocument();

      consoleSpy.restore();
    });
  });

  describe('Adding Todos', () => {
    beforeEach(async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-1')).toBeInTheDocument();
      });
    });

    it('adds a new todo when handleAdd is called', async () => {
      const newTodo = {
        id: 3,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        created_at: '2023-01-03T00:00:00Z'
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newTodo
      } as Response);

      const addButton = screen.getByTestId('mock-add-button');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            title: 'Test Todo', 
            description: 'Test Description', 
            completed: false 
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-3')).toBeInTheDocument();
      });
    });

    it('handles add todo API error', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const addButton = screen.getByTestId('mock-add-button');
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/', expect.any(Object));
      });

      // Original todos should still be there
      expect(screen.getByTestId('todo-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-2')).toBeInTheDocument();

      consoleSpy.restore();
    });
  });

  describe('Updating Todos', () => {
    beforeEach(async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-1')).toBeInTheDocument();
      });
    });

    it('updates a todo when handleUpdate is called', async () => {
      const updatedTodo = { ...mockTodos[0], completed: true };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTodo
      } as Response);

      const updateButton = screen.getByTestId('update-button-1');
      
      await act(async () => {
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedTodo),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-completed-1')).toHaveTextContent('true');
      });
    });

    it('handles update todo API error', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const updateButton = screen.getByTestId('update-button-1');
      
      await act(async () => {
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/1', expect.any(Object));
      });

      // Todo should remain unchanged
      expect(screen.getByTestId('todo-completed-1')).toHaveTextContent('false');

      consoleSpy.restore();
    });
  });

  describe('Deleting Todos', () => {
    beforeEach(async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-1')).toBeInTheDocument();
      });
    });

    it('deletes a todo when handleDelete is called', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const deleteButton = screen.getByTestId('delete-button-1');
      
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/1', {
          method: 'DELETE',
        });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('todo-1')).not.toBeInTheDocument();
      });

      // Todo 2 should still be there
      expect(screen.getByTestId('todo-2')).toBeInTheDocument();
    });

    it('handles delete todo API error', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const deleteButton = screen.getByTestId('delete-button-1');
      
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(mockedFetch).toHaveBeenCalledWith('http://localhost:8000/todos/1', expect.any(Object));
      });

      // Todo should still be there
      expect(screen.getByTestId('todo-1')).toBeInTheDocument();

      consoleSpy.restore();
    });
  });

  describe('Component Structure', () => {
    it('applies correct CSS classes', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      const container = screen.getByTestId('add-todo').parentElement;
      expect(container).toHaveClass('w-full', 'max-w-md');
    });

    it('renders todos with unique keys', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-1')).toBeInTheDocument();
        expect(screen.getByTestId('todo-2')).toBeInTheDocument();
      });

      // Each todo should be uniquely identifiable
      expect(screen.getByTestId('todo-1')).not.toBe(screen.getByTestId('todo-2'));
    });
  });

  describe('Integration with Child Components', () => {
    it('passes correct props to AddTodo', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      const addTodo = screen.getByTestId('add-todo');
      expect(addTodo).toBeInTheDocument();
      
      // Test that the onAdd prop is working
      const addButton = screen.getByTestId('mock-add-button');
      expect(addButton).toBeInTheDocument();
    });

    it('passes correct props to Todo components', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      } as Response);

      await act(async () => {
        render(<TodoList />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('todo-1')).toBeInTheDocument();
      });

      // Check if Todo components receive correct props
      expect(screen.getByTestId('todo-title-1')).toHaveTextContent(mockTodos[0].title);
      expect(screen.getByTestId('todo-description-1')).toHaveTextContent(mockTodos[0].description);
      expect(screen.getByTestId('todo-completed-1')).toHaveTextContent(mockTodos[0].completed.toString());
    });
  });
});