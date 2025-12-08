# Tracker Feature - Quick Reference

## What's New

### 1. Enhanced Token Holdings Display
- See all ERC-20 tokens in tracked wallets
- View balances, decimals, token names
- Organized by blockchain chain
- Native token support (ETH, MATIC, etc.)

### 2. Multi-Chain Support (Base, ETH, Optimism, Arbitrum, Polygon)
- Global chain selector on tracker page
- Per-wallet chain customization
- Support for 5 major EVM chains
- Automatic RPC failover

### 3. Portfolio Summary Dashboard
- Total wallets count
- Tracked chains count  
- Unique tokens across all wallets
- Holdings breakdown by chain

### 4. Portfolio Performance Tracking ⭐ NEW
- Real-time P&L tracking (24h, 7d, 30d, all-time)
- Win rate and trade statistics
- Best/worst trade analysis
- Performance change percentages
- Top performer identification

### 5. Portfolio Health Metrics ⭐ NEW
- **Diversity Score** - Portfolio diversification (0-100)
- **Risk Assessment** - Risk level (Low/Medium/High)
- **Asset Categorization** - Stablecoins, native, DeFi breakdown
- **Risk Indicators** - Concentration warnings, allocation analysis

### 6. Holders Tracking (Like BullX NEO) ⭐ NEW
- Filter by type: All, Dev, Insider, Sniper, Smart Wallet, Bot, Regular
- Sort by: Holding Size, Wallet Score, Transaction Count
- Large holder alerts (>5%)
- Wallet scoring system
- Automatic holder type classification

## Pages & Components

### `/tracker` - Main Tracker Page
- Global chain selector
- Portfolio summary cards
- List of all tracked wallets
- Add/remove wallet buttons

### Components

**ChainSelector** (`src/components/tracker/ChainSelector.tsx`)
- Multi-select chain UI
- Color-coded by chain
- Validates at least one chain selected

**PortfolioSummary** (`src/components/tracker/PortfolioSummary.tsx`)
- Statistics cards
- Chain-by-chain breakdown
- Loading states

**TrackedWalletsList** (`src/components/TrackedWalletsList.tsx`)
- Displays wallet address + label
- Token holdings grouped by chain
- Remove button per wallet
- Loading and empty states

**AddWalletModal** (`src/components/AddWalletModal.tsx`)
- Ethereum address validation
- Optional label field
- Error messages

**PortfolioPerformance** (`src/components/tracker/PortfolioPerformance.tsx`) ⭐ NEW
- P&L tracking (24h, 7d, 30d, all-time)
- Trading statistics (win rate, best/worst trades)
- Diversity score gauge
- Risk assessment card
- Top performers highlight

**HoldersTracker** (`src/components/tracker/HoldersTracker.tsx`) ⭐ NEW
- Filter holders by type
- Sort by holding size, score, or activity
- Large holder warnings
- Wallet scoring
- Type badges (Dev, Insider, Sniper, etc.)

## Libraries

### New Core Libraries
- `src/lib/multiChainClient.ts` - Multi-chain viem clients
- `src/lib/tokenHoldings.ts` - Token balance fetching
- `src/lib/walletActivity.ts` ⭐ NEW - Transaction & holder tracking
- `src/lib/portfolioMetrics.ts` ⭐ NEW - Performance & risk metrics

### Key Functions

```typescript
// Get client for a chain
getChainClient(chainKey: string)

// Fetch native balance
fetchNativeBalance(walletAddress, chainKey)

// Fetch ERC-20 token balance
fetchTokenBalance(walletAddress, tokenAddress, chainKey)

// Fetch all tokens on a chain
fetchWalletTokenHoldings(walletAddress, chainKey, customTokenAddresses?)

// Fetch across multiple chains
fetchAllChainsTokenHoldings(walletAddress, chainKeys, customTokensByChain?)

// Calculate portfolio value (when prices available)
calculatePortfolioValue(holdings, priceMap?)
```

## Data Flow

```
User navigates to /tracker
    ↓
Choose chains (global or per-wallet)
    ↓
Add wallet address + optional label
    ↓
System fetches:
  - Native balance (ETH/MATIC/etc)
  - Popular token balances (USDC, WETH, etc)
  - Token metadata (name, symbol, decimals)
    ↓
Display grouped by chain with balances
    ↓
Portfolio summary shows totals across wallets
```

## Storage

- `trackedWallets` - JSON array of TrackedWallet objects in localStorage
- `trackerSelectedChains` - Array of selected chain keys in localStorage

```typescript
interface TrackedWallet {
  address: string;
  label?: string;
  selectedChains: string[];
}
```

## Supported Chains & RPC Endpoints

| Chain | Primary RPC | Fallbacks |
|-------|------------|-----------|
| Base | superfluid.dev | mainnet.base.org, base.meowrpc.com |
| Ethereum | ALCHEMY_RPC_URL | eth.llamarpc.com, rpc.ankr.com |
| Optimism | mainnet.optimism.io | optimism.publicrpc.com |
| Arbitrum | arb1.arbitrum.io/rpc | rpc.ankr.com/arbitrum |
| Polygon | polygon-rpc.com | rpc.ankr.com/polygon |

## Default Popular Tokens

Each chain has a default list of popular tokens checked:
- Base: USDC, AERO, WETH, Prime
- Ethereum: USDC, WETH, USDT, UNI
- Optimism: USDC, WETH, USDT
- Arbitrum: USDC, WETH, USDT
- Polygon: USDC, WETH, USDT

Custom token addresses can be specified per chain.

## Next Steps

1. **Add Price Integration** - Get real-time token prices from price oracle
2. **Portfolio Value** - Calculate total USD value across holdings
3. **Transaction History** - Show recent buys/sells (like Axiom)
4. **Price Alerts** - Notify when prices cross thresholds
5. **Export** - CSV/JSON export of holdings

## Testing Checklist

- [ ] Add wallet - should save to localStorage
- [ ] Remove wallet - should update list
- [ ] Select chains - global selection works
- [ ] View holdings - tokens display by chain
- [ ] Portfolio summary - counts update correctly
- [ ] Multi-chain fetch - works for Base, ETH, Optimism, etc.
- [ ] Native balances - ETH/MATIC shows correctly
- [ ] Token metadata - names, symbols, decimals display
- [ ] Loading states - show while fetching
- [ ] Empty states - show when no holdings
