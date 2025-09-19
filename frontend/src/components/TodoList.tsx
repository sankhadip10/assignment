'use client';

import { Todo as TodoType } from '@/types';
import TodoComponent from './Todo';
import { useEffect, useState } from 'react';
import AddTodo from './AddTodo';

export default function TodoList() {
  const [todos, setTodos] = useState<TodoType[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/todos/')
      .then((res) => res.json())
      .then((data) => setTodos(data));
  }, []);

  const handleAdd = (title: string, description: string) => {
    fetch('http://localhost:8000/todos/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description, completed: false }),
    })
      .then((res) => res.json())
      .then((newTodo) => {
        setTodos([...todos, newTodo]);
      });
  };

  const handleUpdate = (updatedTodo: TodoType) => {
    fetch(`http://localhost:8000/todos/${updatedTodo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedTodo),
    })
      .then((res) => res.json())
      .then((newTodo) => {
        setTodos(todos.map((todo) => (todo.id === newTodo.id ? newTodo : todo)));
      });
  };

  const handleDelete = (id: number) => {
    fetch(`http://localhost:8000/todos/${id}`, {
      method: 'DELETE',
    }).then(() => {
      setTodos(todos.filter((todo) => todo.id !== id));
    });
  };

  return (
    <div className="w-full max-w-md">
      <AddTodo onAdd={handleAdd} />
      {todos.map((todo) => (
        <TodoComponent key={todo.id} todo={todo} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
    </div>
  );
}
