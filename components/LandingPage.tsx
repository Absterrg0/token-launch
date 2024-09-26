'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, createInitializeMetadataPointerInstruction, createInitializeMint2Instruction, createMintToInstruction, ExtensionType, getAssociatedTokenAddressSync, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from '@solana/spl-token';
import { pack, createInitializeInstruction } from '@solana/spl-token-metadata';
import { motion} from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";

interface LandingPageProps{
  setEndpoint: (endpoint: string) => void;
};

export default function LandingPage({ setEndpoint }:LandingPageProps){
  const [name, setName] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');
  const [imgUrl, setImgUrl] = useState<string>('');
  const [initSupply, setInitSupply] = useState<string>('');
  const { connection } = useConnection();
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [airdropTimer, setAirdropTimer] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setMounted(true);
    setEndpoint('https://api.devnet.solana.com');
  }, [setEndpoint]);

  useEffect(() => {
    if (wallet.publicKey) {
      updateBalance();
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (airdropTimer > 0) {
      interval = setInterval(() => {
        setAirdropTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [airdropTimer]);

  const updateBalance = async () => {
    if (wallet.publicKey) {
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    }
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!wallet.publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const mintKeypair = Keypair.generate();
      const metadata = {
        mint: mintKeypair.publicKey,
        name: name,
        symbol: symbol,
        uri: imgUrl,
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

      const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
        createInitializeMint2Instruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: mintKeypair.publicKey,
          metadata: mintKeypair.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          mintAuthority: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        })
      );

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.partialSign(mintKeypair);

      const txid = await wallet.sendTransaction(transaction, connection);
      toast({
        title: "Token Created",
        description: `Token created successfully. Transaction ID: ${txid}`,
      });

      const associatedToken = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const transaction2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedToken,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );

      await wallet.sendTransaction(transaction2, connection);

      const transaction3 = new Transaction().add(
        createMintToInstruction(mintKeypair.publicKey, associatedToken, wallet.publicKey, Number(initSupply) * LAMPORTS_PER_SOL, [], TOKEN_2022_PROGRAM_ID)
      );

      await wallet.sendTransaction(transaction3, connection);
      toast({
        title: "Token Minted",
        description: `${initSupply} tokens minted successfully`,
      });

      setName('');
      setSymbol('');
      setImgUrl('');
      setInitSupply('');
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignMessage = async () => {
    if (!wallet.signMessage) {
      toast({
        title: "Error",
        description: "Wallet does not support message signing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await wallet.signMessage(encodedMessage);
      setSignature(Buffer.from(signedMessage).toString('base64'));
      toast({
        title: "Message Signed",
        description: "Message signed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAirdrop = async () => {
    if (!wallet.publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const signature = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      updateBalance();
      toast({
        title: "Airdrop Successful",
        description: "1 SOL has been airdropped to your wallet",
      });
      setAirdropTimer(60); // Set 60 seconds cooldown
    } catch (error) {
      toast({
        title: "Airdrop Failed",
        description: "Try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (wallet.publicKey) {
      try {
        await navigator.clipboard.writeText(wallet.publicKey.toBase58());
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  if (!mounted) {
    return null;
  }
  const handleSendTokens = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!wallet.publicKey) {
        toast({ title: "Error", description: "Please connect your wallet first.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    try {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ title: "Error", description: "Invalid amount entered.", variant: "destructive" });
            return;
        }
        const recipientaddress = new PublicKey(recipient)
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: recipientaddress,
                lamports: parsedAmount * LAMPORTS_PER_SOL, // Convert SOL to lamports
            })
        );

        transaction.feePayer = wallet.publicKey;
        await wallet.sendTransaction(transaction, connection);
        toast({ title: "Success", description: `Sent ${amount} SOL to ${recipient}.` });
        setRecipient('');
        setAmount('');
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzAwMDAwMCI+PC9yZWN0Pgo8cGF0aCBkPSJNMzAgMzBMNjAgMCBNMCA2MEwzMCAzMCBNMCAwTDMwIDMwIE0zMCAzMEw2MCA2MCIgc3Ryb2tlPSIjMjIyMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
        <motion.div
          className="absolute inset-0"
          initial={{ backgroundPosition: "0 0" }}
          animate={{ backgroundPosition: "100% 100%" }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          style={{
            background: `linear-gradient(45deg, 
              rgba(59, 130, 246, 0.1) 0%, 
              rgba(147, 51, 234, 0.1) 33%, 
              rgba(236, 72, 153, 0.1) 66%, 
              rgba(59, 130, 246, 0.1) 100%)`,
            backgroundSize: "400% 400%",
          }}
        />
      </div>
      <div className="relative z-10 flex-grow flex flex-col">
        <header className="flex justify-between items-center p-6 bg-black/50 backdrop-blur-md border-b border-gray-800">
          <motion.h1 
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Solana Token LaunchPad
          </motion.h1>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <Button 
                onClick={handleAirdrop} 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200" 
                disabled={isLoading || airdropTimer > 0}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Airdrop
              </Button>
              {airdropTimer > 0 && (
                <span className="text-xs text-gray-400 mt-1">
                  Next airdrop in {airdropTimer}s
                </span>
              )}
            </div>
            <WalletMultiButton className="!bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200" />
          </div>
        </header>
        <main className="flex-grow flex flex-col md:flex-row items-start justify-center p-6 space-y-6 md:space-y-0 md:space-x-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="bg-gray-900/50 backdrop-blur-md border border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Create Token</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Token Name</Label>
                    <Input id="name" placeholder="Token Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-gray-300">Token Symbol</Label>
                    <Input id="symbol" placeholder="Token Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imgUrl" className="text-gray-300">Image URL</Label>
                    <Input id="imgUrl" placeholder="Image URL" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initSupply" className="text-gray-300">Initial Supply</Label>
                    <Input id="initSupply" placeholder="Initial Supply" value={initSupply} onChange={(e) => setInitSupply(e.target.value)} className="bg-gray-800/50 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200" 
                    onClick={handleClick}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Token
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
         <Card className="bg-gray-900/50 backdrop-blur-md border border-gray-800">
            <CardHeader>
        <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Wallet Info &amp; Message Signing</CardTitle>
        </CardHeader>
          <CardContent className="space-y-6">
        {wallet.publicKey ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Public Key</Label>
                <p className="text-blue-400 font-semibold break-all">{wallet.publicKey.toBase58()}</p>
              </div>
              <Button
                onClick={copyToClipboard}
                className="ml-2 p-2 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
              >
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div>
              <Label className="text-gray-300">Balance</Label>
              <p className="text-blue-400 font-semibold">{balance !== null ? `${balance} SOL` : 'Loading...'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">Message to Sign</Label>
              <Textarea
                id="message"
                placeholder="Enter a message to sign"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <Button onClick={handleSignMessage} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign Message
            </Button>
            {signature && (
              <div>
                <Label className="text-gray-300">Signature</Label>
                <p className="text-blue-400 font-semibold break-all">{signature}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-300">Recipient Public Key</Label>
              <Input
                id="recipient"
                placeholder="Enter recipient's public key"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300">Amount (SOL)</Label>
              <Input
                id="amount"
                placeholder="Enter amount to send"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <Button onClick={handleSendTokens} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Tokens
            </Button>
          </>
        ) : (
          <p className="text-gray-400">Please connect your wallet to view information and sign messages.</p>
        )}
      </CardContent>
    </Card>
          </motion.div>
        </main>
        <footer className="mt-auto text-center p-6 bg-black/50 backdrop-blur-md border-t border-gray-800">
          <p className="text-gray-400 mb-2">Solana Token LaunchPad ©2024 - Works on Devnet only</p>
          <div className="flex items-center justify-center text-yellow-500">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <p className="text-sm">Airdrop is limited to 2 times per day</p>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
};
