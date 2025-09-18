'use client';

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import debounce from 'lodash.debounce';

const ZOOM_FACTOR = 0.8;
const INITIAL_DOMAIN: [number, number] = [-5, 5];

export type AppState = {
  func: string;
  guidedMode: boolean;
  domain: [number, number];
  lastSaved: number | null;
};

type Action =
  | { type: 'SET_FUNCTION'; payload: string }
  | { type: 'SET_GUIDED_MODE'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET_ZOOM' };


const initialState: AppState = {
  func: 'sin(x^2 + y^2) / (sqrt(x^2+y^2) + 0.1)',
  guidedMode: false,
  domain: INITIAL_DOMAIN,
  lastSaved: null,
};

function appStateReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FUNCTION':
      return { ...state, func: action.payload, lastSaved: Date.now() };
    case 'SET_GUIDED_MODE':
      return { ...state, guidedMode: action.payload, lastSaved: Date.now() };
    case 'LOAD_STATE':
        // Ensure domain is loaded, or reset to initial if not present
      return { ...action.payload, domain: action.payload.domain || INITIAL_DOMAIN };
    case 'ZOOM_IN': {
      const newDomain: [number, number] = [state.domain[0] * ZOOM_FACTOR, state.domain[1] * ZOOM_FACTOR];
      return { ...state, domain: newDomain };
    }
    case 'ZOOM_OUT': {
       const newDomain: [number, number] = [state.domain[0] / ZOOM_FACTOR, state.domain[1] / ZOOM_FACTOR];
       // Prevent domain from becoming too large
       if (newDomain[1] - newDomain[0] > 1000) return state;
       return { ...state, domain: newDomain };
    }
    case 'RESET_ZOOM':
      return { ...state, domain: INITIAL_DOMAIN };
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
          // Do not save domain in history
          const { domain, ...stateToSave } = appState;
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
  }, [state.func, state.guidedMode, debouncedSave, state.lastSaved]);


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
