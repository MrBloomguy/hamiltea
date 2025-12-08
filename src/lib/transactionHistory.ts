import { getChainClient } from "./multiChainClient";

export interface TransactionRecord {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  input: string;
  isTokenTransfer: boolean;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenAmount?: string;
  tokenDecimals?: number;
  transactionType: "swap" | "approve" | "send" | "receive" | "other";
  chainId: string;
  chainName: string;
}

export interface SwapEvent {
  tokenIn: {
    address: string;
    symbol: string;
    amount: string;
    decimals: number;
  };
  tokenOut: {
    address: string;
    symbol: string;
    amount: string;
    decimals: number;
  };
  priceAtSwap?: number;
  timestamp: number;
  hash: string;
  from: string;
}

// Chain to Etherscan domain mapping
const ETHERSCAN_DOMAINS: Record<string, string> = {
  ethereum: "etherscan.io",
  base: "basescan.org",
  optimism: "optimistic.etherscan.io",
  arbitrum: "arbiscan.io",
  polygon: "polygonscan.com",
};

const ETHERSCAN_API_URLS: Record<string, string> = {
  ethereum: "https://api.etherscan.io/api",
  base: "https://api.basescan.org/api",
  optimism: "https://api-optimistic.etherscan.io/api",
  arbitrum: "https://api.arbiscan.io/api",
  polygon: "https://api.polygonscan.com/api",
};

/**
 * Detect transaction type from function signature
 */
function detectTransactionType(input: string): TransactionRecord["transactionType"] {
  if (input === "0x") return "receive";

  const functionSig = input.slice(0, 10);

  // Uniswap V3 Router
  if (functionSig === "0x3593564c" || functionSig === "0x414bf389") return "swap";
  // Uniswap V2 Router
  if (functionSig === "0x8803dbee" || functionSig === "0x7ff36ab5") return "swap";
  // 1inch Router
  if (functionSig === "0x7c025200" || functionSig === "0x12aa3caf") return "swap";
  // ERC20 Approve
  if (functionSig === "0x095ea7b3") return "approve";

  return "other";
}

/**
 * Fetch transactions from Etherscan API
 */
export async function fetchTransactionsFromEtherscan(
  walletAddress: string,
  chainId: string,
  limit: number = 100
): Promise<TransactionRecord[]> {
  try {
    const apiUrl = ETHERSCAN_API_URLS[chainId];
    const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

    if (!apiUrl || !apiKey) {
      console.warn(`Etherscan not configured for chain: ${chainId}`);
      return [];
    }

    const url = `${apiUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      return [];
    }

    const transactions: TransactionRecord[] = data.result
      .slice(0, limit)
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        valueFormatted: (parseInt(tx.value) / 1e18).toFixed(4),
        timestamp: parseInt(tx.timeStamp) * 1000,
        blockNumber: parseInt(tx.blockNumber),
        gasUsed: tx.gas,
        gasPrice: tx.gasPrice,
        input: tx.input,
        isTokenTransfer: !!tx.functionName && tx.functionName.includes("transfer"),
        tokenAddress: tx.contractAddress,
        transactionType: detectTransactionType(tx.input),
        chainId,
        chainName: chainId.charAt(0).toUpperCase() + chainId.slice(1),
      }));

    return transactions;
  } catch (error) {
    console.error(`Failed to fetch transactions from Etherscan for ${walletAddress}:`, error);
    return [];
  }
}

/**
 * Fetch token transfers for a wallet using Moralis
 */
export async function fetchTokenTransfersFromMoralis(
  walletAddress: string,
  chainId: string
): Promise<TransactionRecord[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      console.warn("Moralis API key not configured");
      return [];
    }

    // Map chain IDs for Moralis
    const chainMap: Record<string, string> = {
      ethereum: "eth",
      base: "base",
      optimism: "optimism",
      arbitrum: "arbitrum",
      polygon: "polygon",
    };

    const chain = chainMap[chainId];
    if (!chain) {
      console.warn(`Moralis does not support chain: ${chainId}`);
      return [];
    }

    const url = `https://api.moralis.io/api/v2/${walletAddress}/erc20/transfers?chain=${chain}&limit=100`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      console.warn(`Moralis API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.result) {
      return [];
    }

    const transactions: TransactionRecord[] = data.result.map((transfer: any) => ({
      hash: transfer.transaction_hash,
      from: transfer.from_address,
      to: transfer.to_address,
      value: transfer.value || "0",
      valueFormatted: transfer.value_decimal || "0",
      timestamp: new Date(transfer.block_timestamp).getTime(),
      blockNumber: transfer.block_number,
      gasUsed: transfer.transaction_fee || "0",
      gasPrice: "0",
      input: "0x",
      isTokenTransfer: true,
      tokenAddress: transfer.address,
      tokenSymbol: transfer.token_symbol,
      tokenName: transfer.token_name,
      tokenAmount: transfer.value_decimal,
      tokenDecimals: transfer.decimals,
      transactionType: transfer.to_address === walletAddress ? "receive" : "send",
      chainId,
      chainName: chainId.charAt(0).toUpperCase() + chainId.slice(1),
    }));

    return transactions;
  } catch (error) {
    console.error(`Failed to fetch token transfers from Moralis:`, error);
    return [];
  }
}

/**
 * Get token price at a specific block/timestamp from Moralis
 */
export async function getTokenPriceAtTime(
  tokenAddress: string,
  chainId: string,
  timestamp: number
): Promise<number | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      return null;
    }

    const chainMap: Record<string, string> = {
      ethereum: "eth",
      base: "base",
      optimism: "optimism",
      arbitrum: "arbitrum",
      polygon: "polygon",
    };

    const chain = chainMap[chainId];
    if (!chain) return null;

    const date = new Date(timestamp).toISOString().split("T")[0];

    const url = `https://api.moralis.io/api/v2/erc20/${tokenAddress}/price?chain=${chain}&include=percent_change`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.usdPrice ? parseFloat(data.usdPrice) : null;
  } catch (error) {
    console.error(`Failed to get token price:`, error);
    return null;
  }
}

/**
 * Get current token price from Moralis
 */
export async function getTokenPrice(
  tokenAddress: string,
  chainId: string
): Promise<number | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      return null;
    }

    const chainMap: Record<string, string> = {
      ethereum: "eth",
      base: "base",
      optimism: "optimism",
      arbitrum: "arbitrum",
      polygon: "polygon",
    };

    const chain = chainMap[chainId];
    if (!chain) return null;

    const url = `https://api.moralis.io/api/v2/erc20/${tokenAddress}/price?chain=${chain}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.usdPrice ? parseFloat(data.usdPrice) : null;
  } catch (error) {
    console.error(`Failed to get token price from Moralis:`, error);
    return null;
  }
}

/**
 * Get token metadata from Moralis
 */
export async function getTokenMetadata(
  tokenAddress: string,
  chainId: string
): Promise<{ symbol: string; decimals: number; name: string } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      return null;
    }

    const chainMap: Record<string, string> = {
      ethereum: "eth",
      base: "base",
      optimism: "optimism",
      arbitrum: "arbitrum",
      polygon: "polygon",
    };

    const chain = chainMap[chainId];
    if (!chain) return null;

    const url = `https://api.moralis.io/api/v2/erc20/${tokenAddress}/metadata?chain=${chain}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      symbol: data.symbol || "UNKNOWN",
      decimals: data.decimals || 18,
      name: data.name || "Unknown Token",
    };
  } catch (error) {
    console.error(`Failed to get token metadata:`, error);
    return null;
  }
}

/**
 * Fetch all transactions and token transfers for a wallet
 */
export async function fetchCompleteWalletHistory(
  walletAddress: string,
  chainId: string
): Promise<TransactionRecord[]> {
  const [etherscanTxs, moralisTxs] = await Promise.all([
    fetchTransactionsFromEtherscan(walletAddress, chainId, 100),
    fetchTokenTransfersFromMoralis(walletAddress, chainId),
  ]);

  // Combine and deduplicate by hash
  const allTxs = [...etherscanTxs, ...moralisTxs];
  const uniqueTxs = Array.from(
    new Map(allTxs.map((tx) => [tx.hash, tx])).values()
  );

  // Sort by timestamp descending
  return uniqueTxs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Cache transactions locally
 */
export function cacheWalletHistory(
  walletAddress: string,
  chainId: string,
  transactions: TransactionRecord[]
): void {
  const key = `wallet_history_${walletAddress}_${chainId}`;
  localStorage.setItem(key, JSON.stringify({ data: transactions, timestamp: Date.now() }));
}

/**
 * Get cached transactions (if less than 5 minutes old)
 */
export function getCachedWalletHistory(
  walletAddress: string,
  chainId: string
): TransactionRecord[] | null {
  const key = `wallet_history_${walletAddress}_${chainId}`;
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  if (timestamp > fiveMinutesAgo) {
    return data;
  }

  localStorage.removeItem(key);
  return null;
}
