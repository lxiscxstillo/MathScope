'use client';

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import debounce from 'lodash.debounce';

export type AppState = {
  func: string;
  guidedMode: boolean;
  lastSaved: number | null;
};

type Action =
  | { type: 'SET_FUNCTION'; payload: string }
  | { type: 'SET_GUIDED_MODE'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: AppState };

const initialState: AppState = {
  func: 'sin(x^2 + y^2) / (x^2 + y^2)',
  guidedMode: false,
  lastSaved: null,
};

function appStateReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FUNCTION':
      return { ...state, func: action.payload, lastSaved: Date.now() };
    case 'SET_GUIDED_MODE':
      return { ...state, guidedMode: action.payload, lastSaved: Date.now() };
    case 'LOAD_STATE':
      return { ...action.payload };
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

  const debouncedSave = useCallback(
    debounce((appState: AppState) => {
      if (appState.func) {
        setHistory(prevHistory => {
          const newHistory = [
            appState,
            ...prevHistory.filter(h => h.func !== appState.func),
          ];
          return newHistory.slice(0, 10);
        });
      }
    }, 1000),
    [setHistory] 
  );

  useEffect(() => {
    debouncedSave(state);
    return () => {
      debouncedSave.cancel();
    };
  }, [state.func, state.guidedMode, debouncedSave, state]);

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
