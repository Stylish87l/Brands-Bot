import { useState, useCallback } from 'react';

interface HistoryState<T> {
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const useHistoryState = <T>(initialState: T): HistoryState<T> => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const present = history[currentIndex];

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    const nextState = typeof newState === 'function'
      ? (newState as (prevState: T) => T)(present)
      : newState;

    // If we're in the past, a new state change should
    // create a new branch, overwriting the "future" states.
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(nextState);

    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history, present]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, history.length]);

  const clearHistory = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
};

export default useHistoryState;