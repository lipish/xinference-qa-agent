import React, { createContext, useContext, useReducer } from 'react';

const QueryContext = createContext();

const initialState = {
  currentQuery: '',
  searchResults: [],
  isLoading: false,
  error: null,
  searchHistory: [],
  favorites: [],
  popularQuestions: []
};

function queryReducer(state, action) {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        currentQuery: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case 'ADD_TO_HISTORY':
      const newHistory = [
        action.payload,
        ...state.searchHistory.filter(item => item.question !== action.payload.question)
      ].slice(0, 10); // Keep only last 10 searches
      
      return {
        ...state,
        searchHistory: newHistory
      };
    
    case 'ADD_TO_FAVORITES':
      if (state.favorites.find(fav => fav.question === action.payload.question)) {
        return state; // Already in favorites
      }
      return {
        ...state,
        favorites: [...state.favorites, action.payload]
      };
    
    case 'REMOVE_FROM_FAVORITES':
      return {
        ...state,
        favorites: state.favorites.filter(fav => fav.question !== action.payload)
      };
    
    case 'SET_POPULAR_QUESTIONS':
      return {
        ...state,
        popularQuestions: action.payload
      };
    
    case 'CLEAR_RESULTS':
      return {
        ...state,
        searchResults: [],
        error: null
      };
    
    default:
      return state;
  }
}

export function QueryProvider({ children }) {
  const [state, dispatch] = useReducer(queryReducer, initialState);
  
  const actions = {
    setQuery: (query) => dispatch({ type: 'SET_QUERY', payload: query }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setResults: (results) => dispatch({ type: 'SET_RESULTS', payload: results }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    addToHistory: (item) => dispatch({ type: 'ADD_TO_HISTORY', payload: item }),
    addToFavorites: (item) => dispatch({ type: 'ADD_TO_FAVORITES', payload: item }),
    removeFromFavorites: (question) => dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: question }),
    setPopularQuestions: (questions) => dispatch({ type: 'SET_POPULAR_QUESTIONS', payload: questions }),
    clearResults: () => dispatch({ type: 'CLEAR_RESULTS' })
  };
  
  return (
    <QueryContext.Provider value={{ state, actions }}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
}
