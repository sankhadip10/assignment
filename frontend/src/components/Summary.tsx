'use client';

import { useState, useEffect } from 'react';

export default function Summary() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:8000/todos/summary');
        if (!res.ok) {
          throw new Error('Failed to fetch summary');
        }
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="p-4 border-t mt-4">
      <h2 className="text-2xl font-bold mb-4">AI-Powered Summary</h2>
      {isLoading && <p>Generating summary...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && (
        <pre className="whitespace-pre-wrap">{summary}</pre>
      )}
    </div>
  );
}
