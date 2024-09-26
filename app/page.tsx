'use client'
import { useState} from 'react';
import LandingPage from "../components/LandingPage";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const [endpoint, setEndpoint] = useState("https://api.devnet.solana.com");
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <LandingPage setEndpoint={setEndpoint} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}