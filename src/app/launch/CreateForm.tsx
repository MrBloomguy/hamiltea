"use client";

import { useState, useEffect } from "react";
import { useSafeWalletAuth } from "@/src/hooks/useSafeWallet";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppFrameLogic } from "@/src/hooks/useAppFrameLogic";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { sharedConfig as config } from "@/src/lib/wagmiConfig";
import { parseEther } from "viem";
import { toast } from "sonner";
import {
  STREME_DEPLOY_V2_ABI,
  STREME_PUBLIC_DEPLOYER_V2,
  STREME_SUPER_TOKEN_FACTORY,
  STREME_ALLOCATION_HOOK,
  LP_FACTORY_ADDRESS,
} from "@/src/lib/contracts";
import {
  createStakingAllocation,
  createVaultAllocation,
  calculateLPAllocation,
  validateAllocations,
} from "@/src/lib/allocationHelpers";

export function CreateForm() {
  const { login, authenticated, user } = useSafeWalletAuth();
  const { isMiniAppView, isConnected, farcasterContext } = useAppFrameLogic();
  const { address } = useAccount();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
  });
  const [useDefaultStaking, setUseDefaultStaking] = useState(true);
  const [vaultMode, setVaultMode] = useState<"off" | "default" | "custom">(
    "off"
  );
  const [v2Config, setV2Config] = useState({
    stakingAllocation: 10,
    stakingLockDays: 1,
    stakingFlowDays: 365,
    stakingDelegate: "",
  });
  const MIN_VAULT_LOCK_DAYS = 7;

  const createEmptyVault = () => ({
    allocation: 0,
    beneficiary: "",
    lockDays: MIN_VAULT_LOCK_DAYS,
    vestingDays: 0,
  });

  // Multiple vaults support
  const [vaults, setVaults] = useState<Array<{
    allocation: number;
    beneficiary: string;
    lockDays: number;
    vestingDays: number;
  }>>([createEmptyVault()]);
  const handleVaultChange = (
    index: number,
    updates: Partial<{
      allocation: number;
      beneficiary: string;
      lockDays: number;
      vestingDays: number;
    }>
  ) => {
    setVaults((prev) =>
      prev.map((vault, i) =>
        i === index
          ? {
              ...vault,
              ...updates,
            }
          : vault
      )
    );
  };
  const addVault = () => {
    setVaults((prev) => [...prev, createEmptyVault()]);
  };
  const removeVault = (index: number) => {
    setVaults((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string>("");

  // Get user's FID and primary address
  const userFid = farcasterContext?.user?.fid || 0;
  const userAddress = address || user?.wallet?.address;

  // Contract constants (matching server implementation)
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"; // Base WETH
  const TOKEN_SUPPLY = parseEther("100000000000"); // 100B tokens (matching server)
  const CREATOR_FEE = 10000; // 10% (matching server)
  const DEV_BUY_FEE = 10000; // 10% (matching server)
  const TICK = -230400; // Uniswap V3 tick (matching server)

  // We'll generate salt only when submitting, not on every keystroke

  // Deploy contract
  const {
    writeContract,
    data: deployHash,
    isPending: isWritePending,
  } = useWriteContract();

  // Wait for deployment transaction
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: deployHash,
    });

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && deployHash) {
      toast.success(
        "🎉 Token deployed successfully! Redirecting in 3 seconds..."
      );
      setIsDeploying(false);

      console.log("Deployment successful, transaction hash:", deployHash);
      if (deployedTokenAddress) {
        console.log("Token address:", deployedTokenAddress);
      }

      // Add a delay to allow backend indexing before redirect
      setTimeout(() => {
        router.push(`/launched-tokens`);
      }, 3000); // 3 second delay
    }
  }, [isTxSuccess, deployHash, router, deployedTokenAddress]);

  // Update loading state
  useEffect(() => {
    setIsDeploying(isWritePending || isTxLoading);
  }, [isWritePending, isTxLoading]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = ""; // Reset the input
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Image must be smaller than 1MB");
      e.target.value = ""; // Reset the input
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    setIsUploadingImage(true);

    try {
      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();

      // Update form data with the uploaded URL
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
      // Clear preview on error
      setPreviewUrl("");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isWalletConnected = isMiniAppView ? isConnected : authenticated;

    if (!isWalletConnected) {
      if (!isMiniAppView) {
        login();
      }
      return;
    }

    if (!userAddress) {
      toast.error("No wallet address found");
      return;
    }

    const sanitizedSymbol = formData.symbol.replace(/\$/g, "").trim();
    if (!sanitizedSymbol) {
      toast.error("Token symbol is required");
      return;
    }

    setIsDeploying(true);

    try {
      console.log(
        "Preparing token deployment for:",
        sanitizedSymbol,
        userAddress
      );

      // Use V2 contracts
      const deployerAddress = STREME_PUBLIC_DEPLOYER_V2;
      const tokenFactory = STREME_SUPER_TOKEN_FACTORY;
      const postDeployHook = STREME_ALLOCATION_HOOK;

      // Generate salt using the appropriate contract
      let salt =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

      try {
        console.log("Generating salt for V2:", deployerAddress);
        console.log("Using TOKEN_FACTORY:", tokenFactory);

        const saltResult = await readContract(config, {
          address: deployerAddress,
          abi: STREME_DEPLOY_V2_ABI,
          functionName: "generateSalt",
          args: [
            sanitizedSymbol,
            userAddress as `0x${string}`,
            tokenFactory,
            WETH_ADDRESS,
          ],
        });

        const [generatedSalt, predictedToken] = saltResult as [
          `0x${string}`,
          `0x${string}`
        ];
        salt = generatedSalt;
        setDeployedTokenAddress(predictedToken);
        console.log(
          "Generated salt:",
          salt,
          "Predicted token:",
          predictedToken
        );
      } catch (saltError) {
        console.warn("Salt generation failed, using default:", saltError);
        // Keep the default 0x0 salt
      }

      // Prepare token config (matching server implementation)
      const tokenConfig = {
        _name: formData.name,
        _symbol: sanitizedSymbol,
        _supply: TOKEN_SUPPLY,
        _fee: CREATOR_FEE,
        _salt: salt, // Use the generated salt (or default if generation failed)
        _deployer: userAddress as `0x${string}`,
        _fid: BigInt(userFid),
        _image: formData.imageUrl || "",
        _castHash: "streme deployment",
        _poolConfig: {
          tick: TICK,
          pairedToken: WETH_ADDRESS as `0x${string}`,
          devBuyFee: DEV_BUY_FEE,
        },
      };

      console.log("Token config:", tokenConfig);

      // Calculate total vault allocation
      const totalVaultAllocation = vaultMode !== "off"
        ? vaults.reduce((sum, vault) => sum + vault.allocation, 0)
        : 0;

      // Validate allocations
      const validation = validateAllocations(
        v2Config.stakingAllocation,
        totalVaultAllocation
      );
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Build allocations array
      const allocations = [];

      // Add staking allocation if > 0
      if (v2Config.stakingAllocation > 0) {
        allocations.push(
          createStakingAllocation(
            v2Config.stakingAllocation,
            v2Config.stakingLockDays,
            v2Config.stakingFlowDays,
            v2Config.stakingDelegate || undefined
          )
        );
      }

      // Add vault allocations if enabled
      if (vaultMode !== "off") {
        for (const vault of vaults) {
          if (vault.allocation > 0) {
            if (!vault.beneficiary) {
              throw new Error("Vault beneficiary address is required for all vaults with allocation > 0");
            }
            if (vault.lockDays < MIN_VAULT_LOCK_DAYS) {
              throw new Error(
                `Vault lock duration must be at least ${MIN_VAULT_LOCK_DAYS} days`
              );
            }
            allocations.push(
              createVaultAllocation(
                vault.allocation,
                vault.beneficiary,
                Math.max(vault.lockDays, MIN_VAULT_LOCK_DAYS),
                vault.vestingDays
              )
            );
          }
        }
      }

      console.log("Deploying V2 token with allocations:", {
        contract: deployerAddress,
        tokenFactory,
        postDeployHook,
        liquidityFactory: LP_FACTORY_ADDRESS,
        tokenConfig,
        allocations,
      });

      // Deploy V2 token with allocations
      writeContract({
        address: deployerAddress,
        abi: STREME_DEPLOY_V2_ABI,
        functionName: "deployWithAllocations",
        args: [
          tokenFactory,
          postDeployHook,
          LP_FACTORY_ADDRESS,
          "0x0000000000000000000000000000000000000000", // postLPHook
          tokenConfig,
          allocations,
        ],
      });

      toast.success("Token deployment initiated!");
    } catch (error) {
      console.error("Token deployment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to deploy token: ${errorMessage}`);
      setIsDeploying(false);
    }
  };

  const isWalletConnected = isMiniAppView ? isConnected : authenticated;
  const buttonText = !isWalletConnected
    ? isMiniAppView
      ? "WALLET CONNECTING..."
      : "CONNECT WALLET TO LAUNCH"
    : isDeploying
    ? "LAUNCHING TOKEN..."
    : "LAUNCH TOKEN";

  // Calculate total vault allocation for display
  const totalVaultAllocation = vaultMode !== "off"
    ? vaults.reduce((sum, vault) => sum + vault.allocation, 0)
    : 0;
  const vaultsWithAllocation = vaults.filter((vault) => vault.allocation > 0);
  const remainingVaultAllocation = Math.max(
    0,
    100 - v2Config.stakingAllocation - totalVaultAllocation
  );

  // Calculate LP allocation for display
  const lpAllocation = calculateLPAllocation(
    v2Config.stakingAllocation,
    totalVaultAllocation
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      {/* SECTION 1: BASIC INFO */}
      <div className="rounded-2xl border border-base-200 bg-base-100/50 backdrop-blur p-5 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 3.75A2 2 0 0110 10.5H8a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold">Basics</h3>
            <p className="text-xs text-base-content/60">Token name and symbol</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="form-control">
            <div className="label px-0 py-2">
              <span className="label-text font-medium text-sm">Token Name *</span>
            </div>
            <input
              type="text"
              placeholder="e.g., MyToken"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input input-sm input-bordered bg-base-100 w-full rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              required
            />
          </label>

          <label className="form-control">
            <div className="label px-0 py-2">
              <span className="label-text font-medium text-sm">Symbol *</span>
            </div>
            <div className="join w-full">
              <span className="join-item px-3 flex items-center bg-base-200 text-base-content/70 font-semibold rounded-l-lg text-sm">
                $
              </span>
              <input
                type="text"
                placeholder="MYTOKEN"
                value={formData.symbol}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  const sanitizedValue = rawValue.startsWith("$")
                    ? rawValue.substring(1)
                    : rawValue;
                  setFormData({ ...formData, symbol: sanitizedValue });
                }}
                className="join-item input input-sm input-bordered bg-base-100 w-full rounded-r-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
            </div>
          </label>
      </div>

      {/* SECTION 2: BRANDING */}
      <div className="rounded-2xl border border-base-200 bg-base-100/50 backdrop-blur p-5 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold">Branding</h3>
            <p className="text-xs text-base-content/60">Image and description</p>
          </div>
        </div>

        <label className="form-control">
          <div className="label px-0 py-2">
            <span className="label-text font-medium text-sm">Image URL</span>
          </div>
          <input
            type="text"
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="input input-sm input-bordered bg-base-100 w-full rounded-lg focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
          />
          {previewUrl && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-base-200/50 border border-base-200">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-base-300 shrink-0">
                <Image
                  src={previewUrl}
                  alt="Token preview"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-base-content/70">Image preview loaded ✓</span>
            </div>
          )}
        </label>

        <div className="divider my-3"></div>

        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="btn btn-outline btn-sm flex-1 rounded-lg"
          >
            {isUploadingImage ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Image
              </>
            )}
          </label>
        </div>

        <label className="form-control">
          <div className="label px-0 py-2">
            <span className="label-text font-medium text-sm">Description</span>
          </div>
          <textarea
            placeholder="Describe what makes your token unique..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="textarea textarea-bordered bg-base-100 rounded-lg min-h-[80px] focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
          />
        </label>
      </div>

      {/* SECTION 3: STAKING CONFIGURATION */}
      <div className="rounded-2xl border border-base-200 bg-base-100/50 backdrop-blur p-5 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold">Staking</h3>
            <p className="text-xs text-base-content/60">Configure rewards for token holders</p>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setUseDefaultStaking(true);
              setV2Config({
                ...v2Config,
                stakingAllocation: 10,
                stakingLockDays: 1,
                stakingFlowDays: 365,
              });
            }}
            className={`p-3 rounded-lg border-2 transition-all ${
              useDefaultStaking && v2Config.stakingAllocation === 10
                ? "border-accent bg-accent/10"
                : "border-base-200 hover:border-base-300"
            }`}
          >
            <div className="text-left">
              <div className="font-semibold text-sm">Standard</div>
              <div className="text-[11px] opacity-60 mt-1">10% • 1d • 365d</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUseDefaultStaking(false)}
            className={`p-3 rounded-lg border-2 transition-all ${
              !useDefaultStaking
                ? "border-accent bg-accent/10"
                : "border-base-200 hover:border-base-300"
            }`}
          >
            <div className="text-left">
              <div className="font-semibold text-sm">Custom</div>
              <div className="text-[11px] opacity-60 mt-1">Customize values</div>
            </div>
          </button>
        </div>

        {!useDefaultStaking && (
          <div className="space-y-4 p-4 rounded-lg bg-base-200/30 border border-base-200">
            <div>
              <label className="block mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  Allocation %
                  <div className="tooltip tooltip-right" data-tip="% of total supply for staking rewards">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={v2Config.stakingAllocation}
                onChange={(e) =>
                  setV2Config({
                    ...v2Config,
                    stakingAllocation: Number(e.target.value),
                  })
                }
                className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Lock Duration (days)
                    <div className="tooltip tooltip-right" data-tip="Minimum staking period before unstaking allowed">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={v2Config.stakingLockDays}
                  onChange={(e) =>
                    setV2Config({
                      ...v2Config,
                      stakingLockDays: Number(e.target.value),
                    })
                  }
                  className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Flow Duration (days)
                    <div className="tooltip tooltip-right" data-tip="Total distribution duration for staking rewards">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={v2Config.stakingFlowDays}
                  onChange={(e) =>
                    setV2Config({
                      ...v2Config,
                      stakingFlowDays: Number(e.target.value),
                    })
                  }
                  className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  Delegate Address (optional)
                  <div className="tooltip tooltip-right" data-tip="Alternative address for staking rewards">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </span>
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={v2Config.stakingDelegate}
                onChange={(e) =>
                  setV2Config({
                    ...v2Config,
                    stakingDelegate: e.target.value,
                  })
                }
                className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            {/* Smart Validation Warnings */}
            <div className="space-y-2 mt-4">
              {v2Config.stakingLockDays > 30 && (
                <div className="alert alert-warning py-2 px-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs">
                    Long lock duration ({v2Config.stakingLockDays} days) may
                    discourage stakers
                  </span>
                </div>
              )}
              {v2Config.stakingAllocation < 3 && (
                <div className="alert alert-info py-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-info shrink-0 w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs">
                    Low staking allocation ({v2Config.stakingAllocation}%) may
                    not attract stakers
                  </span>
                </div>
              )}
              {v2Config.stakingFlowDays < 90 && (
                <div className="alert alert-warning py-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs">
                    Short flow duration ({v2Config.stakingFlowDays} days) means
                    rapid reward depletion
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Token Metadata */}
      <div className="rounded-2xl border border-base-200 bg-base-100/70 backdrop-blur p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-base-content/60">Story</p>
            <h3 className="text-lg font-semibold">Token metadata</h3>
          </div>
          <span className="badge badge-ghost badge-sm">Optional</span>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Description</label>
          <textarea
            placeholder="Describe your token..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="textarea textarea-bordered w-full h-24 bg-base-100 rounded-xl"
          />
        </div>
      </div>

      {/* SECTION 4: VAULT (ADVANCED) */}
      <div className="rounded-2xl border border-base-200 bg-base-100/50 backdrop-blur p-5 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold">Vaults</h3>
            <p className="text-xs text-base-content/60">Lock tokens for beneficiaries (optional)</p>
          </div>
        </div>

        {/* Vault Mode Selection */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              vaultMode === "off"
                ? "border-warning bg-warning/10"
                : "border-base-200 hover:border-base-300"
            }`}
            onClick={() => {
              setVaultMode("off");
              setVaults([createEmptyVault()]);
            }}
          >
            <div className="font-semibold text-sm">Off</div>
          </button>
          <button
            type="button"
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              vaultMode === "default"
                ? "border-warning bg-warning/10"
                : "border-base-200 hover:border-base-300"
            }`}
            onClick={() => {
              setVaultMode("default");
              setVaults([{
                allocation: 10,
                beneficiary: "",
                lockDays: 30,
                vestingDays: 365,
              }]);
            }}
          >
            <div className="font-semibold text-sm">Default</div>
            <div className="text-[10px] opacity-60 mt-1">10% • 30d • 365d</div>
          </button>
          <button
            type="button"
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              vaultMode === "custom"
                ? "border-warning bg-warning/10"
                : "border-base-200 hover:border-base-300"
            }`}
            onClick={() => {
              setVaultMode("custom");
              setVaults((prev) =>
                prev.map((vault) => ({
                  ...vault,
                  lockDays:
                    vault.lockDays < MIN_VAULT_LOCK_DAYS
                      ? MIN_VAULT_LOCK_DAYS
                      : vault.lockDays,
                }))
              );
            }}
          >
            <div className="font-semibold text-sm">Custom</div>
            <div className="text-[10px] opacity-60 mt-1">Customize</div>
          </button>
        </div>

        {/* Vault Fields (only show when not "off") */}
        {vaultMode !== "off" && (
          <div className="space-y-4 p-4 rounded-lg bg-base-200/30 border border-base-200">
            {vaults.map((vault, index) => {
              const otherAllocation = vaults.reduce((sum, currentVault, currentIndex) => {
                if (currentIndex === index) return sum;
                const value = Number.isFinite(currentVault.allocation)
                  ? currentVault.allocation
                  : 0;
                return sum + value;
              }, 0);
              const allocationValue = Number.isFinite(vault.allocation)
                ? vault.allocation
                : 0;
              const remainingForVault =
                100 - v2Config.stakingAllocation - otherAllocation;
              const allowedMax = Math.max(
                Math.round(allocationValue),
                Math.floor(Math.max(0, remainingForVault))
              );

              return (
                <div
                  key={`vault-${index}`}
                  className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Vault {index + 1}</span>
                    {vaultMode === "custom" && vaults.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => removeVault(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block mb-2">
                        <span className="text-sm font-medium">Allocation %</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={allowedMax}
                        value={allocationValue}
                        onChange={(e) => {
                          const parsed = Number(e.target.value);
                          const nextValue = Number.isNaN(parsed)
                            ? 0
                            : Math.min(Math.max(0, Math.round(parsed)), allowedMax);
                          handleVaultChange(index, { allocation: nextValue });
                        }}
                        className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-warning/30 focus:border-warning transition-all"
                        disabled={vaultMode === "default"}
                      />
                    </div>

                    <div>
                      <label className="block mb-2">
                        <span className="text-sm font-medium">Beneficiary Address</span>
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={vault.beneficiary}
                        onChange={(e) =>
                          handleVaultChange(index, { beneficiary: e.target.value })
                        }
                        className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-warning/30 focus:border-warning transition-all"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-2">
                          <span className="text-sm font-medium">Lock Duration (days)</span>
                        </label>
                        <input
                          type="number"
                          min={MIN_VAULT_LOCK_DAYS}
                          value={vault.lockDays}
                          onChange={(e) => {
                            const parsed = Number(e.target.value);
                            const nextValue = Number.isNaN(parsed)
                              ? MIN_VAULT_LOCK_DAYS
                              : Math.max(MIN_VAULT_LOCK_DAYS, Math.round(parsed));
                            handleVaultChange(index, { lockDays: nextValue });
                          }}
                          className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-warning/30 focus:border-warning transition-all"
                          disabled={vaultMode === "default"}
                        />
                      </div>
                      <div>
                        <label className="block mb-2">
                          <span className="text-sm font-medium">Vesting Duration (days)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={vault.vestingDays}
                          onChange={(e) => {
                            const parsed = Number(e.target.value);
                            const nextValue = Number.isNaN(parsed)
                              ? 0
                              : Math.max(0, Math.round(parsed));
                            handleVaultChange(index, { vestingDays: nextValue });
                          }}
                          className="input input-sm input-bordered w-full bg-base-100 rounded-lg focus:ring-2 focus:ring-warning/30 focus:border-warning transition-all"
                          disabled={vaultMode === "default"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {vaultMode === "custom" && (
              <button
                type="button"
                className="btn btn-sm btn-ghost border-2 border-dashed border-base-300 text-primary w-full rounded-lg"
                onClick={addVault}
                disabled={remainingVaultAllocation <= 0}
              >
                + Add Vault
              </button>
            )}

            {remainingVaultAllocation > 0 && (
              <div className="text-xs text-base-content/60 p-2 rounded bg-base-200/30">
                Remaining allocation: <span className="font-semibold">{remainingVaultAllocation.toFixed(2)}%</span>
              </div>
            )}

            {totalVaultAllocation > 20 && (
              <div className="alert alert-warning py-2 px-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs">High vault allocation reduces liquidity</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 5: SUMMARY & DEPLOYMENT */}
      <div className="rounded-2xl border border-base-200 bg-gradient-to-br from-base-100/50 to-primary/5 backdrop-blur p-5 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-info/10">
            <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold">Summary</h3>
            <p className="text-xs text-base-content/60">Review your token configuration</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Token Info */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-base-content/50 tracking-wide">Token Info</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Name</span>
                <span className="font-semibold">{formData.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Symbol</span>
                <span className="font-semibold">${formData.symbol || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Supply</span>
                <span className="font-semibold">100B</span>
              </div>
            </div>
          </div>

          {/* Staking Config */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-base-content/50 tracking-wide">Staking</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Allocation</span>
                <span className="font-semibold">{v2Config.stakingAllocation}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Lock Period</span>
                <span className="font-semibold">{v2Config.stakingLockDays}d</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Flow Duration</span>
                <span className="font-semibold">{v2Config.stakingFlowDays}d</span>
              </div>
            </div>
          </div>

          {/* Vault Summary */}
          {vaultMode !== "off" && (
            <div className="space-y-2 md:col-span-2">
              <div className="text-xs font-semibold uppercase text-base-content/50 tracking-wide">Vaults</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Total Locked</span>
                  <span className="font-semibold">{totalVaultAllocation}%</span>
                </div>
                {vaultsWithAllocation.length > 0 && (
                  <div className="text-xs opacity-70">
                    {vaultsWithAllocation.length} vault{vaultsWithAllocation.length !== 1 ? 's' : ''} configured
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liquidity Pool */}
          <div className="space-y-2 md:col-span-2">
            <div className="text-xs font-semibold uppercase text-base-content/50 tracking-wide">Liquidity Pool</div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">WETH Pair</span>
              <span className="font-semibold">{lpAllocation}%</span>
            </div>
          </div>
        </div>

        <div className="divider my-3"></div>

        {/* Deploy Button */}
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full rounded-lg font-semibold"
          disabled={(isMiniAppView && !isConnected) || isDeploying}
        >
          {isDeploying ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Deploying...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {buttonText}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
