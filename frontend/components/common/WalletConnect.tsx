'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      const connector = connectors[0];
      if (connector) connect({ connector });
    }
  };

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <button
      onClick={handleClick}
      className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
        isConnected
          ? 'bg-green-600/20 text-green-400 border border-green-500/30'
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {isConnected ? displayAddress : 'Connect Wallet'}
    </button>
  );
}
