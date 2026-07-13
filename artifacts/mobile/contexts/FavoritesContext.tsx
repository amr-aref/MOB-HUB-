import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesContextType {
  favoriteStores: string[];
  favoriteProducts: string[];
  toggleFavoriteStore: (id: string) => void;
  toggleFavoriteProduct: (id: string) => void;
  isStoreFavorite: (id: string) => boolean;
  isProductFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteStores: [],
  favoriteProducts: [],
  toggleFavoriteStore: () => {},
  toggleFavoriteProduct: () => {},
  isStoreFavorite: () => false,
  isProductFavorite: () => false,
});

const STORES_KEY = '@marketplace_fav_stores';
const PRODUCTS_KEY = '@marketplace_fav_products';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORES_KEY),
      AsyncStorage.getItem(PRODUCTS_KEY),
    ]).then(([storesJson, productsJson]) => {
      if (storesJson) setFavoriteStores(JSON.parse(storesJson));
      if (productsJson) setFavoriteProducts(JSON.parse(productsJson));
    });
  }, []);

  const toggleFavoriteStore = useCallback((id: string) => {
    setFavoriteStores((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      AsyncStorage.setItem(STORES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavoriteProduct = useCallback((id: string) => {
    setFavoriteProducts((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isStoreFavorite = useCallback((id: string) => favoriteStores.includes(id), [favoriteStores]);
  const isProductFavorite = useCallback((id: string) => favoriteProducts.includes(id), [favoriteProducts]);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteStores,
        favoriteProducts,
        toggleFavoriteStore,
        toggleFavoriteProduct,
        isStoreFavorite,
        isProductFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
