"use client";

import { NextPage } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import USDTTransferFrom from "./USDTTransferFrom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Home: NextPage = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col">
      <Head>
        <title>synCDapp - USDT Transfer</title>
        <meta name="description" content="Transfer USDT using synCDapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">synCDapp</h1>
          <ConnectButton />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to synCDapp
            </CardTitle>
            <CardDescription className="text-center">
              Connect your wallet and transfer USDT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && (
              <div className="text-center">
                <p className="mb-4">
                  Please connect your wallet to get started
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            )}
            {isConnected && <USDTTransferFrom />}
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white shadow mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 synCDapp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
