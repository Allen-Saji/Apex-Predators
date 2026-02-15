'use client';

import { ConnectKitButton } from 'connectkit';

export default function WalletConnect() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress }) => (
        <button
          onClick={show}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
            isConnected
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isConnected ? truncatedAddress : 'Connect Wallet'}
        </button>
      )}
    </ConnectKitButton.Custom>
  );
}
