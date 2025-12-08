"use client";

import { useState, useEffect } from "react";
import BackButton from "../../components/BackButton";
import { AddWalletModal } from "../../components/AddWalletModal";
import { TrackedWalletsList } from "../../components/TrackedWalletsList";
import { HeroAnimationMini } from "../../components/HeroAnimationMini";
import { ChainSelector } from "../../components/tracker/ChainSelector";
import { PortfolioSummary } from "../../components/tracker/PortfolioSummary";
import { PNLDisplay } from "../../components/tracker/PNLDisplay";
import { TransactionHistory } from "../../components/tracker/TransactionHistory";

export interface TrackedWallet {
  address: string;
  label?: string;
  selectedChains: string[];
}

type TabType = "holdings" | "transactions" | "pnl";

export default function TrackerPage() {
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [selectedChains, setSelectedChains] = useState<string[]>(["base"]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("holdings");
  const [selectedWalletIndex, setSelectedWalletIndex] = useState<number>(0);

  // Load tracked wallets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("trackedWallets");
    const storedChains = localStorage.getItem("trackerSelectedChains");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate from old string format to new object format
        const wallets: TrackedWallet[] = Array.isArray(parsed)
          ? parsed.map((item: string | TrackedWallet) =>
              typeof item === "string"
                ? { address: item, label: "", selectedChains: ["base"] }
                : item
            )
          : [];
        setTrackedWallets(wallets);
      } catch (error) {
        console.error("Failed to load tracked wallets:", error);
      }
    }
    if (storedChains) {
      try {
        setSelectedChains(JSON.parse(storedChains));
      } catch (error) {
        console.error("Failed to load selected chains:", error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save tracked wallets to localStorage
  const saveWallets = (wallets: TrackedWallet[]) => {
    localStorage.setItem("trackedWallets", JSON.stringify(wallets));
    setTrackedWallets(wallets);
  };

  const saveSelectedChains = (chains: string[]) => {
    localStorage.setItem("trackerSelectedChains", JSON.stringify(chains));
    setSelectedChains(chains);
  };

  const addWallet = (address: string, label?: string) => {
    if (!trackedWallets.some((w) => w.address === address)) {
      saveWallets([
        ...trackedWallets,
        {
          address: address.toLowerCase(),
          label: label || "",
          selectedChains: selectedChains,
        },
      ]);
    }
  };

  const removeWallet = (address: string) => {
    saveWallets(trackedWallets.filter((w) => w.address !== address));
  };

  const updateWalletChains = (address: string, chains: string[]) => {
    saveWallets(
      trackedWallets.map((w) =>
        w.address === address ? { ...w, selectedChains: chains } : w
      )
    );
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-full w-full flex flex-col">
        {/* Compact Header */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BackButton alwaysShow={true} />
                <div>
                  <h1 className="text-xl font-bold">Tracker</h1>
                  <p className="text-xs text-muted-foreground">
                    {trackedWallets.length === 0 ? "Add wallets to get started" : `${trackedWallets.length} wallet${trackedWallets.length !== 1 ? 's' : ''} tracked`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddWalletModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                + Add Wallet
              </button>
            </div>
          </div>

          {/* Chain Selector */}
          {trackedWallets.length > 0 && (
            <div className="px-6 pb-4 pt-2 border-t border-border/50">
              <ChainSelector
                selectedChains={selectedChains}
                onChainsChange={saveSelectedChains}
              />
            </div>
          )}
        </div>

        {trackedWallets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                No wallets tracked yet. Add your first wallet to get started!
              </p>
              <button
                onClick={() => setShowAddWalletModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Add Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Wallet & View Tabs */}
            <div className="border-b border-border bg-card">
              <div className="flex overflow-x-auto">
                {/* Wallet Tabs */}
                <div className="flex border-r border-border/50">
                  {trackedWallets.map((wallet, index) => (
                    <button
                      key={wallet.address}
                      onClick={() => {
                        setSelectedWalletIndex(index);
                        setActiveTab("holdings");
                      }}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        selectedWalletIndex === index
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {wallet.label || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                    </button>
                  ))}
                </div>

                {/* View Tabs */}
                <div className="flex ml-2 border-l border-border/50">
                  <button
                    onClick={() => setActiveTab("holdings")}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "holdings"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "transactions"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    Transactions
                  </button>
                  <button
                    onClick={() => setActiveTab("pnl")}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "pnl"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    P&L
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {activeTab === "holdings" && (
                <TrackedWalletsList
                  wallets={trackedWallets}
                  onRemoveWallet={removeWallet}
                  onUpdateWalletChains={updateWalletChains}
                  defaultChains={selectedChains}
                />
              )}

              {activeTab === "transactions" && trackedWallets[selectedWalletIndex] && (
                <TransactionHistory
                  walletAddress={trackedWallets[selectedWalletIndex].address}
                  chainId={trackedWallets[selectedWalletIndex].selectedChains[0] || "base"}
                  limit={50}
                />
              )}

              {activeTab === "pnl" && trackedWallets[selectedWalletIndex] && (
                <PNLDisplay
                  walletAddress={trackedWallets[selectedWalletIndex].address}
                  chainId={trackedWallets[selectedWalletIndex].selectedChains[0] || "base"}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <AddWalletModal
        isOpen={showAddWalletModal}
        onClose={() => setShowAddWalletModal(false)}
        onAddWallet={(address, label) => {
          addWallet(address, label);
          setShowAddWalletModal(false);
        }}
      />
    </div>
  );
}
