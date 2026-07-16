import { useState, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'SAVE_FOOD_SEARCH_HISTORY';
const MAX_HISTORY = 5;

export const useLiveSearch = () => {
  const [query, setQuery] = useState('');
  const [recentHistory, setRecentHistory] = useState<string[]>([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setRecentHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
  }, []);

  const saveToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setRecentHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
      const newHistory = [searchTerm, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const removeHistoryItem = useCallback((searchTerm: string) => {
    setRecentHistory(prev => {
      const newHistory = prev.filter(item => item !== searchTerm);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return {
    query,
    setQuery,
    recentHistory,
    saveToHistory,
    clearHistory,
    removeHistoryItem
  };
};
