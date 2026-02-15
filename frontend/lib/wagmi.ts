'use client';

import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultConfig } from 'connectkit';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const config = createConfig(
  getDefaultConfig({
    chains: [monadTestnet],
    transports: {
      [monadTestnet.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '',
    appName: 'Apex Predators',
    appDescription: 'AI Agent MMA Arena on Monad',
  }),
);
