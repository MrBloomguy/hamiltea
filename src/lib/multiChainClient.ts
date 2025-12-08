import { createPublicClient, http, fallback, Chain } from "viem";
import { base, mainnet, optimism, arbitrum, polygon } from "viem/chains";

// Define supported chains with their RPC endpoints
export const SUPPORTED_CHAINS: Record<string, { chain: Chain; rpcEndpoints: string[] }> = {
  base: {
    chain: base,
    rpcEndpoints: [
      "https://rpc-endpoints.superfluid.dev/base-mainnet?app=streme-x8fsj6",
      "https://mainnet.base.org",
      "https://developer-access-mainnet.base.org",
      "https://base.meowrpc.com",
      "https://1rpc.io/base",
    ],
  },
  ethereum: {
    chain: mainnet,
    rpcEndpoints: [
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://1rpc.io/eth",
    ],
  },
  optimism: {
    chain: optimism,
    rpcEndpoints: [
      "https://mainnet.optimism.io",
      "https://optimism.publicrpc.com",
      "https://rpc.ankr.com/optimism",
    ],
  },
  arbitrum: {
    chain: arbitrum,
    rpcEndpoints: [
      "https://arb1.arbitrum.io/rpc",
      "https://rpc.ankr.com/arbitrum",
      "https://1rpc.io/arb",
    ],
  },
  polygon: {
    chain: polygon,
    rpcEndpoints: [
      "https://polygon-rpc.com",
      "https://rpc.ankr.com/polygon",
      "https://1rpc.io/matic",
    ],
  },
};

// Create a client for a specific chain
export function createChainClient(chainKey: string) {
  const chainConfig = SUPPORTED_CHAINS[chainKey];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chainKey}`);
  }

  return createPublicClient({
    chain: chainConfig.chain,
    transport: fallback(
      chainConfig.rpcEndpoints.map((url) =>
        http(url, {
          timeout: 10_000,
          retryCount: 2,
          retryDelay: 1000,
          batch: true,
        })
      ),
      {
        rank: false,
      }
    ),
  });
}

// Cache of clients to avoid recreating them
const clientCache: Record<string, ReturnType<typeof createChainClient>> = {};

export function getChainClient(chainKey: string) {
  if (!clientCache[chainKey]) {
    clientCache[chainKey] = createChainClient(chainKey);
  }
  return clientCache[chainKey];
}

// Default Base client for backward compatibility
export { createPublicClient } from "viem";
