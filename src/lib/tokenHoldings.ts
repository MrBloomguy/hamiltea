import { getChainClient, SUPPORTED_CHAINS } from "./multiChainClient";
import { formatUnits } from "viem";

export interface TokenHolding {
  chainId: string;
  chainName: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  balanceUSD?: number;
  logo?: string;
  isNative?: boolean;
}

// Standard ERC20 ABI for balance and metadata queries
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Common token addresses across chains for quick lookup
const NATIVE_TOKENS = {
  base: { name: "Base Ethereum", symbol: "ETH", decimals: 18 },
  ethereum: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  optimism: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  arbitrum: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  polygon: { name: "Matic", symbol: "MATIC", decimals: 18 },
};

interface ChainTokens {
  base: string[];
  ethereum: string[];
  optimism: string[];
  arbitrum: string[];
  polygon: string[];
}

// Popular token addresses to check across chains
const POPULAR_TOKENS: ChainTokens = {
  base: [
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    "0xd9aAEc86B65D86f6A7B630E7ee733E0511C2758C", // AERO
    "0x4200000000000000000000000000000000000006", // WETH
    "0x50c5725949A6F0c72E6C4a641F8290314933B0cF", // Prime
  ],
  ethereum: [
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "0xC02aaA39b223FE8D0A0e8e4F27ead9083C756Cc2", // WETH
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
  ],
  optimism: [
    "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
    "0x4200000000000000000000000000000000000006", // WETH
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
  ],
  arbitrum: [
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5F8a", // USDC
    "0x82aF49447980E8B74B37a2edffeE8f4A9fEbc1Cc", // WETH
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
  ],
  polygon: [
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
  ],
};

export async function fetchNativeBalance(
  walletAddress: string,
  chainKey: string
): Promise<TokenHolding | null> {
  try {
    const client = getChainClient(chainKey);
    const balance = await client.getBalance({ address: walletAddress as `0x${string}` });

    const nativeTokenInfo = NATIVE_TOKENS[chainKey as keyof typeof NATIVE_TOKENS];
    if (!nativeTokenInfo) return null;

    const balanceFormatted = formatUnits(balance, nativeTokenInfo.decimals);

    return {
      chainId: chainKey,
      chainName: chainKey.charAt(0).toUpperCase() + chainKey.slice(1),
      address: "native",
      symbol: nativeTokenInfo.symbol,
      name: nativeTokenInfo.name,
      decimals: nativeTokenInfo.decimals,
      balance: balance.toString(),
      balanceFormatted,
      isNative: true,
    };
  } catch (error) {
    console.error(`Failed to fetch native balance on ${chainKey}:`, error);
    return null;
  }
}

export async function fetchTokenBalance(
  walletAddress: string,
  tokenAddress: string,
  chainKey: string
): Promise<TokenHolding | null> {
  try {
    const client = getChainClient(chainKey);

    // Fetch balance
    const balance = (await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    })) as bigint;

    // Skip if zero balance
    if (balance === BigInt(0)) return null;

    // Fetch token metadata
    const [decimals, name, symbol] = await Promise.all([
      (client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as Promise<number>,
      (client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "name",
      })) as Promise<string>,
      (client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "symbol",
      })) as Promise<string>,
    ]);

    const balanceFormatted = formatUnits(balance, decimals);

    return {
      chainId: chainKey,
      chainName: chainKey.charAt(0).toUpperCase() + chainKey.slice(1),
      address: tokenAddress,
      symbol,
      name,
      decimals,
      balance: balance.toString(),
      balanceFormatted,
    };
  } catch (error) {
    console.error(`Failed to fetch token balance for ${tokenAddress} on ${chainKey}:`, error);
    return null;
  }
}

export async function fetchWalletTokenHoldings(
  walletAddress: string,
  chainKey: string,
  customTokenAddresses?: string[]
): Promise<TokenHolding[]> {
  try {
    const holdings: TokenHolding[] = [];

    // Get native balance
    const nativeBalance = await fetchNativeBalance(walletAddress, chainKey);
    if (nativeBalance && parseFloat(nativeBalance.balanceFormatted) > 0.0001) {
      holdings.push(nativeBalance);
    }

    // Get token addresses to check
    const tokensToCheck = customTokenAddresses || POPULAR_TOKENS[chainKey as keyof ChainTokens] || [];

    // Fetch all token balances in parallel
    const tokenBalancesPromises = tokensToCheck.map((tokenAddress) =>
      fetchTokenBalance(walletAddress, tokenAddress, chainKey).catch((error) => {
        console.error(`Error fetching token ${tokenAddress} on ${chainKey}:`, error);
        return null;
      })
    );

    const tokenBalances = await Promise.all(tokenBalancesPromises);
    holdings.push(...tokenBalances.filter((balance) => balance !== null));

    return holdings;
  } catch (error) {
    console.error(`Failed to fetch wallet holdings on ${chainKey}:`, error);
    return [];
  }
}

export async function fetchAllChainsTokenHoldings(
  walletAddress: string,
  chainKeys: string[] = Object.keys(SUPPORTED_CHAINS),
  customTokensByChain?: Record<string, string[]>
): Promise<Record<string, TokenHolding[]>> {
  const result: Record<string, TokenHolding[]> = {};

  const holdingsPromises = chainKeys.map(async (chainKey) => {
    const customTokens = customTokensByChain?.[chainKey];
    const holdings = await fetchWalletTokenHoldings(walletAddress, chainKey, customTokens);
    return { chainKey, holdings };
  });

  const chainResults = await Promise.all(holdingsPromises);

  for (const { chainKey, holdings } of chainResults) {
    result[chainKey] = holdings;
  }

  return result;
}

export function calculatePortfolioValue(
  holdings: TokenHolding[],
  priceMap?: Record<string, number>
): { total: number; byChain: Record<string, number> } {
  const byChain: Record<string, number> = {};
  let total = 0;

  for (const holding of holdings) {
    const price = priceMap?.[holding.address] ?? 0;
    const value = parseFloat(holding.balanceFormatted) * price;

    if (!byChain[holding.chainId]) {
      byChain[holding.chainId] = 0;
    }

    byChain[holding.chainId] += value;
    total += value;
  }

  return { total, byChain };
}
