'use client';

import { useEffect, useState } from 'react';
import CreateButton from './ui/CreateButton';
import LabelledInput from './ui/LabelledInput';
import Heading from './ui/Heading';
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'; // Example wallet

export default function LandingPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [initSupply, setInitSupply] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleClick = () => {
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Image URL:', imgUrl);
    console.log('Initial Supply:', initSupply);
  };

  return (
    <ConnectionProvider endpoint="https://solana-mainnet.g.alchemy.com/v2/5mtxHg6xy0-tWQJtwt7bGXB7wqKUZ7bt">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="flex justify-between bg-black p-3">
            <ButtonValue />
          </div>
          <div className="flex justify-center items-center h-screen bg-black">
            <div className="bg-zinc-300 rounded p-6 m-4 shadow-lg">
              <Heading heading="Solana Token LaunchPad" />
              <LabelledInput
                label="Enter name:"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <LabelledInput
                label="Enter symbol:"
                placeholder="Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
              <LabelledInput
                label="Image URL:"
                placeholder="Img URL"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
              />
              <LabelledInput
                label="Initial supply:"
                placeholder="Initial supply"
                value={initSupply}
                onChange={(e) => setInitSupply(e.target.value)}
              />
              <CreateButton onClick={handleClick} textButton="Create Token" />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function ButtonValue() {
  const { connected } = useWallet();
  return (
    <div>
      {connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
    </div>
  );
}
