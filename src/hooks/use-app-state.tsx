'use client';

import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';

export type AppState = {
  func: string;
  guidedMode: boolean;
  lastSaved: number | null;
};

type Action =
  | { type: 'SET_FUNCTION'; payload: string }
  | { type: 'SET_GUIDED_MODE'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'SAVE_TO_HISTORY' };

const initialState: AppState = {
  func: 'sin(x^2 + y^2) / (x^2 + y^2)',
  guidedMode: false,
  lastSaved: null,
};

function appStateReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FUNCTION':
      return { ...state, func: action.payload };
    case 'SET_GUIDED_MODE':
      return { ...state, guidedMode: action.payload };
    case 'LOAD_STATE':
      return { ...action.payload };
    case 'SAVE_TO_HISTORY':
        return { ...state, lastSaved: Date.now() };
    default:
      return state;
  }
}

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const [history, setHistory] = useLocalStorage<AppState[]>('multicalc-history', []);

  // Effect to auto-save to history on change
  useEffect(() => {
    const handler = setTimeout(() => {
        if (state.func) {
            dispatch({ type: 'SAVE_TO_HISTORY' });
        }
    }, 1000); // Debounce saving

    return () => {
        clearTimeout(handler);
    };
  }, [state.func, state.guidedMode]);

  useEffect(() => {
    if (state.lastSaved) {
        const currentState = {...state};
        setHistory(prevHistory => {
            const newHistory = [currentState, ...prevHistory.filter(h => h.func !== currentState.func)];
            return newHistory.slice(0, 10); // Keep only the last 10 entries
        });
    }
  }, [state.lastSaved, setHistory]);


  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
