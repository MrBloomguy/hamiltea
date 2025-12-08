import { getChainClient, SUPPORTED_CHAINS } from "./multiChainClient";
import { formatUnits } from "viem";

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  timestamp: number;
  blockNumber: number;
  gasUsed?: string;
  gasPrice?: string;
  input: string;
  isTokenTransfer: boolean;
  tokenSymbol?: string;
  tokenAmount?: string;
  transactionType: "send" | "receive" | "swap" | "approve" | "other";
}

export interface WalletActivity {
  walletAddress: string;
  chainId: string;
  lastBlockScanned: number;
  transactions: Transaction[];
  totalTransactions: number;
  lastUpdated: number;
}

export interface HolderInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  percentage: number;
  holderType: "dev" | "insider" | "sniper" | "smart_wallet" | "bot" | "regular";
  firstSeen: number;
  lastActive: number;
  transactionCount: number;
}

// Transaction type detection patterns
const SWAP_SIGNATURES = [
  "0x3593564c", // Uniswap Router exactInputSingle
  "0x414bf389", // Uniswap Router exactInputMultiple
  "0x8803dbee", // Uniswap V2 Router swapExactTokensForTokens
];

const APPROVE_SIGNATURE = "0x095ea7b3"; // ERC20 approve

/**
 * Detect transaction type from function signature
 */
export function detectTransactionType(input: string): Transaction["transactionType"] {
  if (input === "0x") return "other";

  const functionSig = input.slice(0, 10);

  if (SWAP_SIGNATURES.includes(functionSig)) return "swap";
  if (functionSig === APPROVE_SIGNATURE) return "approve";

  return "other";
}

/**
 * Identify holder type based on behavior patterns
 */
export function identifyHolderType(
  address: string,
  balance: string,
  transactionCount: number,
  holdersList: HolderInfo[]
): HolderInfo["holderType"] {
  // Check if it's a known contract (dev, insider, etc.)
  // This is a simplified version - in production you'd query a database

  const balanceNum = parseFloat(balance);

  // Large holders with few transactions = likely insider/dev
  if (balanceNum > 1000000 && transactionCount < 5) {
    return "insider";
  }

  // Many transactions with small buys = sniper
  if (transactionCount > 50 && balanceNum < 100000) {
    return "sniper";
  }

  // Known bot patterns (contracts, specific naming)
  if (address.startsWith("0x")) {
    return "bot";
  }

  // High transaction volume = smart wallet
  if (transactionCount > 100) {
    return "smart_wallet";
  }

  return "regular";
}

/**
 * Fetch recent transactions for a wallet
 * Note: This is a simplified implementation using public RPC data
 * For production, use Etherscan/Alchemy APIs for better data
 */
export async function fetchWalletTransactions(
  walletAddress: string,
  chainKey: string,
  limit: number = 50
): Promise<Transaction[]> {
  try {
    const client = getChainClient(chainKey);

    // Get the latest block number
    const latestBlock = await client.getBlockNumber();

    // Fetch transaction history (this is a simplified approach)
    // In production, you'd use Etherscan API or Alchemy Enhanced API
    const transactions: Transaction[] = [];

    // Return empty for now - would need external API for full transaction history
    return transactions;
  } catch (error) {
    console.error(`Failed to fetch transactions for ${walletAddress} on ${chainKey}:`, error);
    return [];
  }
}

/**
 * Fetch holder list for a token
 * Requires querying a blockchain indexing service
 */
export async function fetchTokenHolders(
  tokenAddress: string,
  chainKey: string,
  limit: number = 100
): Promise<HolderInfo[]> {
  try {
    // This would require integrating with:
    // - Etherscan API (tokenholders endpoint)
    // - Alchemy API (getAssetTransfers)
    // - Graph Protocol (Uniswap subgraph)
    // - Custom indexing solution

    const holders: HolderInfo[] = [];

    // Placeholder - implementation requires external API
    return holders;
  } catch (error) {
    console.error(`Failed to fetch token holders for ${tokenAddress}:`, error);
    return [];
  }
}

/**
 * Detect if a wallet is a sniper (early buyer of new tokens)
 */
export function detectSniperWallet(
  wallet: HolderInfo,
  tokenLaunchTime: number
): boolean {
  // Wallet bought within first 1 minute of token launch
  const oneMinute = 60 * 1000;
  return wallet.firstSeen <= tokenLaunchTime + oneMinute;
}

/**
 * Calculate wallet score based on activity
 * Higher score = more active/sophisticated trader
 */
export function calculateWalletScore(wallet: HolderInfo): number {
  let score = 0;

  // Transaction frequency (max 30 points)
  score += Math.min(wallet.transactionCount / 10, 30);

  // Holder type weights
  const typeWeights: Record<HolderInfo["holderType"], number> = {
    smart_wallet: 40,
    insider: 35,
    sniper: 20,
    bot: 15,
    dev: 50,
    regular: 10,
  };

  score += typeWeights[wallet.holderType];

  // Holding percentage (max 20 points)
  score += Math.min(wallet.percentage * 100, 20);

  return Math.round(score);
}

/**
 * Group holders by type
 */
export function groupHoldersByType(holders: HolderInfo[]): Record<HolderInfo["holderType"], HolderInfo[]> {
  const grouped: Record<HolderInfo["holderType"], HolderInfo[]> = {
    dev: [],
    insider: [],
    sniper: [],
    smart_wallet: [],
    bot: [],
    regular: [],
  };

  for (const holder of holders) {
    grouped[holder.holderType].push(holder);
  }

  return grouped;
}

/**
 * Detect suspicious activity patterns
 */
export function detectAnomalies(
  wallet: HolderInfo,
  averageHoldings: number
): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Unusually large holding
  if (wallet.percentage > 10) {
    reasons.push("Large holder (>10%)");
  }

  // Dev/insider with recent activity
  if ((wallet.holderType === "dev" || wallet.holderType === "insider") && wallet.lastActive > Date.now() - 3600000) {
    reasons.push("Dev/Insider recent activity");
  }

  // Sniper wallet patterns
  if (wallet.holderType === "sniper" && wallet.transactionCount > 500) {
    reasons.push("Excessive sniper activity");
  }

  // Contract addresses (potential rug pull)
  if (wallet.holderType === "bot") {
    reasons.push("Contract address holder");
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}
