# Tracker Feature Documentation

## Overview

The **Tracker** is a comprehensive wallet monitoring feature for the HamilTea platform, allowing users to track multiple wallets across multiple EVM chains (Base, Ethereum, Optimism, Arbitrum, Polygon) in real-time.

## Features Implemented

### 1. **Enhanced Token Holdings Display** ✅
- View all ERC-20 tokens held in tracked wallets
- Display token balance, symbol, name, and decimals
- Group holdings by blockchain chain
- Real-time balance fetching from blockchain
- Supports native tokens (ETH, MATIC, etc.)

### 2. **Multi-Chain Support** ✅
- **Supported Chains:**
  - Base
  - Ethereum
  - Optimism
  - Arbitrum
  - Polygon
- Select which chains to track globally
- Per-wallet chain selection
- Automatic fallback to popular token list
- Configurable custom token addresses

### 3. **Portfolio Value Aggregation** ✅
- Summary dashboard showing:
  - Total tracked wallets
  - Number of tracked chains
  - Total unique tokens across all wallets
  - Holdings breakdown by chain
- Easy-to-read portfolio statistics

### 4. **Wallet Management**
- Add wallets with optional labels
- Remove wallets from tracking
- Per-wallet address and chain selection
- Persistent storage using localStorage

## Architecture

### New Files Created

```
src/
├── lib/
│   ├── multiChainClient.ts          # Multi-chain viem client factory
│   └── tokenHoldings.ts              # Token balance fetching logic
├── components/
│   ├── AddWalletModal.tsx            # Updated with label support
│   ├── TrackedWalletsList.tsx        # Updated with token displays
│   └── tracker/
│       ├── ChainSelector.tsx         # Chain selection UI
│       └── PortfolioSummary.tsx      # Portfolio statistics
└── app/
    └── tracker/
        └── page.tsx                  # Main tracker page
```

### Key Libraries & APIs

- **Viem** - Low-level blockchain interaction
- **viem/chains** - Chain definitions (base, mainnet, optimism, arbitrum, polygon)
- **localStorage** - Client-side persistence

## Usage

### Adding a Wallet

1. Navigate to `/tracker`
2. Click "Add Wallet"
3. Enter wallet address (Ethereum format: 0x...)
4. (Optional) Add a label to identify the wallet
5. Click "Add Wallet"

### Selecting Chains

Use the "Select Chains to Track" section to choose which EVM chains to monitor. You can select multiple chains and can update this at any time.

### Viewing Holdings

Each tracked wallet displays:
- Wallet address (shortened)
- Custom label (if provided)
- Token holdings grouped by chain
- Token balance, symbol, name, and address

### Portfolio Summary

The dashboard shows:
- **Total Wallets** - Number of tracked wallets
- **Tracked Chains** - Number of selected chains
- **Unique Tokens** - Total token count across all wallets
- **Holdings by Chain** - Token count per chain

## Technical Details

### Multi-Chain Client Factory

```typescript
// Usage
const baseClient = getChainClient("base");
const ethClient = getChainClient("ethereum");
const arbClient = getChainClient("arbitrum");
```

Supports automatic RPC failover with:
- Configurable RPC endpoints per chain
- 10-second timeout
- 2 retry attempts with 1-second delay
- Request batching enabled

### Token Holdings Fetcher

```typescript
// Fetch native balance (ETH, MATIC, etc.)
const balance = await fetchNativeBalance(walletAddress, "base");

// Fetch specific ERC-20 token
const tokenBalance = await fetchTokenBalance(
  walletAddress,
  tokenAddress,
  "ethereum"
);

// Fetch all holdings across multiple chains
const allHoldings = await fetchAllChainsTokenHoldings(
  walletAddress,
  ["base", "ethereum", "optimism"]
);
```

### Popular Token Lists

Default tokens checked per chain:
- **Base:** USDC, AERO, WETH, Prime
- **Ethereum:** USDC, WETH, USDT, UNI
- **Optimism:** USDC, WETH, USDT
- **Arbitrum:** USDC, WETH, USDT
- **Polygon:** USDC, WETH, USDT

Custom token lists can be passed to any fetcher function.

## Future Enhancements

### Priority 1: Price Integration
- [ ] Add USD price conversion using price oracle
- [ ] Display token values in USD
- [ ] Calculate total portfolio value

### Priority 2: Transaction History
- [ ] Integrate Etherscan/Alchemy transaction API
- [ ] Show recent transactions for tracked wallets
- [ ] Track buying/selling activity (like Axiom's pulse)

### Priority 3: Price Alerts
- [ ] Set price alerts for specific tokens
- [ ] Notify when prices cross thresholds
- [ ] Support push notifications

### Priority 4: Export Functionality
- [ ] Export holdings to CSV
- [ ] Export to JSON
- [ ] Shareable portfolio reports

### Priority 5: Advanced Analytics
- [ ] Historical balance tracking
- [ ] Profit/loss calculations
- [ ] Performance charts
- [ ] Tax reporting tools

## Database Schema (Future)

When implementing backend persistence:

```typescript
interface TrackedWallet {
  id: string;
  userId: string;
  address: string;
  label?: string;
  selectedChains: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TokenPrice {
  id: string;
  chainId: string;
  address: string;
  priceUSD: number;
  lastUpdated: Date;
}

interface PortfolioSnapshot {
  id: string;
  walletId: string;
  timestamp: Date;
  totalValueUSD: number;
  holdings: TokenHolding[];
}
```

## Error Handling

- Graceful fallbacks for failed RPC calls
- Automatic retry with exponential backoff
- Zero-balance tokens filtered out
- Invalid chain keys throw descriptive errors
- Failed token metadata queries skip that token

## Performance Optimizations

- Client caching prevents duplicate viem client creation
- Parallel fetching of all wallets and chains
- Batch RPC requests via viem
- localStorage caching of wallet configurations
- Lazy loading of token metadata

## Browser Compatibility

- Requires modern browser with ES2020+ support
- localStorage support required
- Works on mobile and desktop

## Security Considerations

- No private keys stored or transmitted
- Read-only blockchain queries
- localStorage data only visible to this domain
- No wallet connection required (view-only)
- All data stays in browser or on public RPC endpoints
