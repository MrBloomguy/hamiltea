# YouBuidl - Creator Economy Streaming Platform

YouBuidl enables **creators to launch their own coins on EVM networks** (Base, Optimism, Arbitrum, Polygon, Ethereum) and **stream daily earnings** to their community. Built for creators, by builders. Includes portfolio tracking tools to help traders monitor their creator coin investments.

## 📚 Documentation

For complete platform documentation, features, API setup, and deployment instructions, see:

- **[README_YOUBUIDL.md](./README_YOUBUIDL.md)** - Main platform documentation
- **[TRACKER_GUIDE.md](./TRACKER_GUIDE.md)** - Wallet tracker user guide
- **[TRACKER_FEATURES.md](./TRACKER_FEATURES.md)** - Technical architecture
- **[TRACKER_UI_REDESIGN.md](./TRACKER_UI_REDESIGN.md)** - UI/UX design details
- **[__tests__/README.md](./__tests__/README.md)** - Test suite documentation

## 🚀 Quick Start

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ✨ Key Features

### 🌊 Streaming (Flagship)
- **Creator Coin Launches** - Builders launch their own coins on Base, Optimism, Arbitrum, Polygon, Ethereum
- **Daily Earnings Streams** - Automated real-time payment streams using Superfluid protocol
- **Community Rewards** - Coins holders earn daily revenue shares from creator activities

### 📊 Portfolio Tracking (Supporting Tool)
- **Multi-Wallet Tracker** - Monitor holdings across multiple wallets and EVM chains
- **Creator Coin Portfolio** - Track all creator coins you've invested in
- **Real-Time P&L** - Live profit/loss calculations with weighted average entry prices
- **Transaction History** - Complete trading history from Etherscan and Moralis APIs
- **Performance Analytics** - Diversity scoring, risk assessment, holder classification

### 🛠️ Platform Features
- **Multi-Chain Support** - Base, Optimism, Arbitrum, Polygon, Ethereum
- **Smart Caching** - Optimized API calls preventing rate limiting
- **Professional UI** - Compact, data-dense interface for serious traders

## 🛠️ Tech Stack

- **Next.js 15.5.7** - Full-stack React framework
- **TypeScript** - Type-safe development
- **Viem 2.31.2** - Ethereum client
- **Tailwind CSS** - Utility-first styling
- **Superfluid SDK** - Real-time streaming
- **APIs:** Moralis, Alchemy, Etherscan

## 🔧 Environment Setup

See [README_YOUBUIDL.md](./README_YOUBUIDL.md#-api-keys--configuration) for detailed API key setup.

Required keys:
- `NEXT_PUBLIC_MORALIS_API_KEY` - Moralis JWT token
- `NEXT_PUBLIC_ALCHEMY_API_KEY` - Alchemy API key
- `NEXT_PUBLIC_ETHERSCAN_API_KEY` - Etherscan API key

## 📦 Project Structure

```
src/
├── app/
│   ├── tracker/          # Wallet tracker page
│   └── api/              # API routes
├── components/
│   ├── tracker/          # Tracker-specific components
│   └── ...
├── lib/
│   ├── tokenHoldings.ts      # Token fetching
│   ├── transactionHistory.ts # Transaction API integration
│   ├── pnlCalculator.ts      # P&L calculations
│   ├── walletActivity.ts     # Transaction analysis
│   └── ...
└── hooks/
    └── ... custom React hooks
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

See [__tests__/README.md](./__tests__/README.md) for testing documentation.

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh)
- [Superfluid Documentation](https://docs.superfluid.finance)
- [Tailwind CSS](https://tailwindcss.com)

## 🚀 Deployment

See [README_YOUBUIDL.md](./README_YOUBUIDL.md#-deployment) for deployment options:
- Vercel (recommended)
- Docker container
- Traditional Node.js server

## 📝 License

Built on Streme.fun architecture. See acknowledgments in [README_YOUBUIDL.md](./README_YOUBUIDL.md).

## 🤝 Contributing

Contributions welcome! Please review our guidelines in [README_YOUBUIDL.md](./README_YOUBUIDL.md#-contributing).

---

**Platform:** YouBuidl - Web3 Trading & Streaming  
**Version:** 1.0.0  
**Last Updated:** December 2025

