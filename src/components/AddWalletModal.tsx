"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { isAddress } from "viem";

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWallet: (address: string, label?: string) => void;
}

export function AddWalletModal({
  isOpen,
  onClose,
  onAddWallet,
}: AddWalletModalProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    // Validate address
    if (!walletAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    if (!isAddress(walletAddress)) {
      setError("Invalid Ethereum address");
      return;
    }

    // Add the wallet
    onAddWallet(walletAddress.toLowerCase(), walletName || undefined);

    // Reset form
    setWalletAddress("");
    setWalletName("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Add Wallet to Track</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Wallet Address *
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 bg-input border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Main Wallet, Trading Wallet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              className="w-full px-4 py-2 bg-input border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Add Wallet
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
