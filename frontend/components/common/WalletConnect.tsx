'use client';

import { useState } from 'react';

export default function WalletConnect() {
  const [connected, setConnected] = useState(false);

  return (
    <button
      onClick={() => setConnected(!connected)}
      className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
        connected
          ? 'bg-green-600/20 text-green-400 border border-green-500/30'
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {connected ? '0x1a2b...ef12' : 'Connect Wallet'}
    </button>
  );
}
