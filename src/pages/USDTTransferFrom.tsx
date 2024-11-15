"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, InfoIcon, Loader2 } from "lucide-react";

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

// Updated ABI with correct structure
const USDT_ABI = [
  {
    name: "transferFrom",
    type: "function",
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
];

export default function USDTTransferFrom() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [mounted, setMounted] = useState(false);

  const [isTransferring, setIsTransferring] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [allowance, setAllowance] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkBalance = useCallback(async () => {
    if (!publicClient || !address) return;

    setIsCheckingBalance(true);
    setError(null);

    try {
      const balance = await publicClient.readContract({
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: "balanceOf",
        args: [address],
      })as bigint;
      setBalance(formatUnits(balance, 6));
    } catch (error) {
      console.error("Error checking balance:", error);
      setError("Failed to check balance. Please try again.");
    } finally {
      setIsCheckingBalance(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (mounted && address) {
      checkBalance();
    }
  }, [mounted, address, checkBalance]);

  const checkAllowance = async () => {
    if (!publicClient || !address || !fromAddress) {
      setError("Please connect your wallet and enter the 'From' address");
      return;
    }

    setIsCheckingAllowance(true);
    setError(null);

    try {
      const allowance = await publicClient.readContract({
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: "allowance",
        args: [fromAddress, address],
      })as bigint;
      setAllowance(formatUnits(allowance, 6));
    } catch (error) {
      console.error("Error checking allowance:", error);
      setError(
        "Failed to check allowance. Please ensure the 'From' address is valid."
      );
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  const handleTransferFrom = async () => {
    if (!walletClient || !address) {
      setError("Please connect your wallet");
      return;
    }
  
    if (!fromAddress || !toAddress || !amount || parseFloat(amount) <= 0) {
      setError("Please fill in all fields with valid values");
      return;
    }
  
    setIsTransferring(true);
    setError(null);
  
    try {
      const parsedAmount = parseUnits(amount, 6);
  
      // Bypassing simulateContract and directly using writeContract
      const request = {
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: "transferFrom",
        args: [fromAddress, toAddress, parsedAmount],
        account: address,
      };
  
      const hash = await walletClient.writeContract(request);
      console.log("Transaction Hash:", hash);
      alert(`TransferFrom transaction sent! Hash: ${hash}`);
  
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction Receipt:", receipt);
  
      if (receipt.status === "success") {
        alert("TransferFrom transaction confirmed!");
        checkBalance();
        checkAllowance();
        clearForm();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Error during transferFrom:", error);
      if (error.code === 4001) {
        setError("Transaction rejected by user");
      } else if (error.message?.includes("insufficient allowance")) {
        setError(
          "Insufficient allowance. Please ensure the 'From' address has approved enough USDT for you to spend."
        );
      } else {
        setError(
          error.message || "Error during transferFrom. Please check your inputs and try again."
        );
      }
    } finally {
      setIsTransferring(false);
    }
  };
  

  const clearForm = () => {
    setFromAddress("");
    setToAddress("");
    setAmount("");
    setAllowance(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>USDT Transfer</CardTitle>
        <CardDescription>
          Transfer USDT from one address to another
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm mb-2">
            Connected Account: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
          </p>
          {isCheckingBalance ? (
            <p className="text-sm mb-2">Checking balance...</p>
          ) : (
            balance && (
              <p className="text-sm mb-2">
                <strong>Your USDT Balance:</strong> {parseFloat(balance).toFixed(2)} USDT
              </p>
            )
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="fromAddress">From Address</Label>
            <Input
              id="fromAddress"
              type="text"
              placeholder="Enter sender's address"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="toAddress">To Address</Label>
            <Input
              id="toAddress"
              type="text"
              placeholder="Enter recipient's address"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (USDT)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount to transfer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button
          onClick={checkAllowance}
          disabled={isCheckingAllowance}
          className="w-full"
        >
          {isCheckingAllowance ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Allowance...
            </>
          ) : (
            "Check Allowance"
          )}
        </Button>

        {allowance !== null && (
          <p className="text-sm">
            <strong>Current Allowance:</strong> {parseFloat(allowance).toFixed(2)} USDT
          </p>
        )}

        <Alert variant="warning">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Ensure that the 'from' address has approved you to spend their USDT. The allowance must be greater than or equal to the transfer amount.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleTransferFrom}
          disabled={isTransferring}
          className="w-full"
        >
          {isTransferring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transferring...
            </>
          ) : (
            "Transfer USDT"
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
