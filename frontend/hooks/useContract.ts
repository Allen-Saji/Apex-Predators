'use client';

// Placeholder hooks for contract interaction
// Will be connected to real contracts after deployment

export function useContractRead() {
  return { data: null, isLoading: false, error: null };
}

export function useContractWrite() {
  return { write: () => {}, isLoading: false, error: null };
}
