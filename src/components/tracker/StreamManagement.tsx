"use client";

import { useEffect, useState } from "react";
import { type StreamData } from "../../lib/streamingAnalytics";

interface StreamManagementProps {
  walletAddress: string;
  onCreateStream?: (streamData: Partial<StreamData>) => void;
  onCancelStream?: (streamAddress: string) => void;
  isLoading?: boolean;
}

interface StreamFormData {
  recipient: string;
  tokenAddress: string;
  flowRate: string;
  duration?: number;
}

export function StreamManagement({
  walletAddress,
  onCreateStream,
  onCancelStream,
  isLoading = false,
}: StreamManagementProps) {
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [formData, setFormData] = useState<StreamFormData>({
    recipient: "",
    tokenAddress: "",
    flowRate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipient || !formData.recipient.startsWith("0x")) {
      newErrors.recipient = "Invalid recipient address";
    }

    if (!formData.tokenAddress || !formData.tokenAddress.startsWith("0x")) {
      newErrors.tokenAddress = "Invalid token address";
    }

    if (!formData.flowRate || parseFloat(formData.flowRate) <= 0) {
      newErrors.flowRate = "Flow rate must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onCreateStream?.({
      receiver: formData.recipient,
      tokenAddress: formData.tokenAddress,
      flowRate: formData.flowRate,
      sender: walletAddress,
      isActive: true,
      startTime: Date.now(),
      tokenSymbol: "TOKEN",
    });

    // Reset form
    setFormData({ recipient: "", tokenAddress: "", flowRate: "" });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "create"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Stream
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manage"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Manage Streams
        </button>
      </div>

      {activeTab === "create" && (
        <div className="bg-card rounded border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={formData.recipient}
                onChange={(e) => {
                  setFormData({ ...formData, recipient: e.target.value });
                  if (errors.recipient) {
                    setErrors({ ...errors, recipient: "" });
                  }
                }}
                className={`w-full px-4 py-2 rounded border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.recipient ? "border-destructive" : "border-border"
                }`}
              />
              {errors.recipient && (
                <p className="text-xs text-destructive mt-1">{errors.recipient}</p>
              )}
            </div>

            {/* Token Address */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Token Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={formData.tokenAddress}
                onChange={(e) => {
                  setFormData({ ...formData, tokenAddress: e.target.value });
                  if (errors.tokenAddress) {
                    setErrors({ ...errors, tokenAddress: "" });
                  }
                }}
                className={`w-full px-4 py-2 rounded border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.tokenAddress ? "border-destructive" : "border-border"
                }`}
              />
              {errors.tokenAddress && (
                <p className="text-xs text-destructive mt-1">{errors.tokenAddress}</p>
              )}
            </div>

            {/* Flow Rate */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Flow Rate (tokens/second)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0001"
                  step="0.0001"
                  value={formData.flowRate}
                  onChange={(e) => {
                    setFormData({ ...formData, flowRate: e.target.value });
                    if (errors.flowRate) {
                      setErrors({ ...errors, flowRate: "" });
                    }
                  }}
                  className={`w-full px-4 py-2 rounded border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.flowRate ? "border-destructive" : "border-border"
                  }`}
                />
              </div>
              {errors.flowRate && (
                <p className="text-xs text-destructive mt-1">{errors.flowRate}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Per day:{" "}
                {formData.flowRate
                  ? (parseFloat(formData.flowRate) * 86400).toFixed(6)
                  : "0"}{" "}
                tokens
              </p>
            </div>

            {/* Duration (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (optional)
              </label>
              <select
                value={formData.duration || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData({ ...formData, duration: value });
                }}
                className="w-full px-4 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Indefinite</option>
                <option value={86400}>1 day</option>
                <option value={604800}>1 week</option>
                <option value={2592000}>30 days</option>
                <option value={31536000}>1 year</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating Stream..." : "Create Stream"}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Streaming requires the token to be SuperFluid
              enabled. The stream will transfer tokens continuously from your wallet to
              the recipient. Make sure you have sufficient balance to cover the duration.
            </p>
          </div>
        </div>
      )}

      {activeTab === "manage" && (
        <div className="bg-card rounded border border-border p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">
              Your active streams will appear here
            </p>
            <p className="text-xs text-muted-foreground">
              Create a stream first to manage it
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
