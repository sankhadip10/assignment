'use client';

import { Todo } from '@/types';
import { useState } from 'react';

interface TodoProps {
  todo: Todo;
  onUpdate: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export default function TodoComponent({ todo, onUpdate, onDelete }: TodoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);

  const handleUpdate = () => {
    onUpdate({ ...todo, title, description });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      {isEditing ? (
        <div className="flex flex-col w-full">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded mb-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded mb-2"
          />
          <div className="flex justify-end">
            <button onClick={handleUpdate} className="bg-blue-500 text-white p-2 rounded mr-2">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white p-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onUpdate({ ...todo, completed: !todo.completed })}
            className="mr-4"
          />
          <div>
            <h2 className={`text-lg ${todo.completed ? 'line-through' : ''}`}>{todo.title}</h2>
            <p className="text-sm text-gray-500">{todo.description}</p>
          </div>
        </div>
      )}
      {!isEditing && (
        <div className="flex items-center">
          <button onClick={() => setIsEditing(true)} className="bg-yellow-500 text-white p-2 rounded mr-2">
            Edit
          </button>
          <button onClick={() => onDelete(todo.id!)} className="bg-red-500 text-white p-2 rounded">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
