
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock the child components
jest.mock('@/components/TodoList', () => {
  return function MockTodoList() {
    return <div data-testid="todo-list">Mocked TodoList Component</div>;
  };
});

jest.mock('@/components/Summary', () => {
  return function MockSummary() {
    return <div data-testid="summary">Mocked Summary Component</div>;
  };
});

describe('Home Page', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the main page with correct structure', () => {
    render(<Home />);

    // Check if the main container is present
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex', 'min-h-screen', 'flex-col', 'items-center', 'p-24');
  });

  it('displays the correct page title', () => {
    render(<Home />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Todo App');
    expect(title).toHaveClass('text-4xl', 'font-bold', 'mb-8');
  });

  it('renders the Summary component', () => {
    render(<Home />);

    const summary = screen.getByTestId('summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Mocked Summary Component');
  });

  it('renders the TodoList component', () => {
    render(<Home />);

    const todoList = screen.getByTestId('todo-list');
    expect(todoList).toBeInTheDocument();
    expect(todoList).toHaveTextContent('Mocked TodoList Component');
  });

  it('renders components in correct order', () => {
    render(<Home />);

    const main = screen.getByRole('main');
    const children = Array.from(main.children);

    // Check the order: title, summary, todo list
    expect(children[0]).toHaveTextContent('Todo App');
    expect(children[1]).toHaveAttribute('data-testid', 'summary');
    expect(children[2]).toHaveAttribute('data-testid', 'todo-list');
  });

  it('has correct accessibility attributes', () => {
    render(<Home />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    render(<Home />);

    const main = screen.getByRole('main');
    expect(main).toHaveClass(
      'flex',
      'min-h-screen', 
      'flex-col',
      'items-center',
      'p-24'
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass(
      'text-4xl',
      'font-bold',
      'mb-8'
    );
  });

  it('matches snapshot', () => {
    const { container } = render(<Home />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
