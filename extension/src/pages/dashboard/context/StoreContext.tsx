import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import type { AppStorage } from '../../shared/types';
import { getStore, onStoreChange } from '../../../shared/storage/store';
import { DEFAULT_STORE } from '../../../shared/storage/store';

interface StoreContextValue {
  store: AppStorage;
  refresh: () => void;
}

const StoreContext = createContext<StoreContextValue>({
  store: DEFAULT_STORE,
  refresh: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(
    (_: AppStorage, next: AppStorage) => next,
    DEFAULT_STORE
  );

  const refresh = () => {
    getStore().then((s) => dispatch(s));
  };

  useEffect(() => {
    refresh();
    const unsub = onStoreChange(() => refresh());
    return unsub;
  }, []);

  return <StoreContext.Provider value={{ store, refresh }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
