'use client';

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import debounce from 'lodash.debounce';

export type AppState = {
  func: string;
  lastSaved: number | null;
};

type Action =
  | { type: 'SET_FUNCTION'; payload: string }
  | { type: 'LOAD_STATE'; payload: AppState };


const initialState: AppState = {
  func: 'sin(x) / x',
  lastSaved: null,
};

function appStateReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FUNCTION':
      return { ...state, func: action.payload, lastSaved: Date.now() };
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((appState: AppState) => {
      if (appState.func) {
        setHistory(prevHistory => {
          const { ...stateToSave } = appState;
          const newHistory = [
            stateToSave as AppState,
            ...prevHistory.filter(h => h.func !== appState.func),
          ];
          return newHistory.slice(0, 10);
        });
      }
    }, 1000),
    [setHistory] 
  );

  useEffect(() => {
    if (state.lastSaved !== null) {
      debouncedSave(state);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [state.func, debouncedSave, state.lastSaved]);


  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState debe ser usado dentro de un AppStateProvider');
  }
  return context;
}
