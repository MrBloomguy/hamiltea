# 🚀 YouBuidl - Creator Streaming Platform

YouBuidl is the flagship **creator economy streaming platform** on EVM networks where creators launch their own coins and stream daily earnings in real-time to their communities. Includes portfolio tracking tools for traders monitoring creator coin investments.

**Originally forked from:** [Streme.fun](https://streme.fun) - now evolved into a platform for creators and traders

## 🌟 Key Features

### **🌊 Streaming (Flagship Feature)** ⭐
- **Creator Coin Launch** - Deploy your own token on Base, Optimism, Arbitrum, Polygon, or Ethereum
- **Real-Time Earnings Streams** - Superfluid-powered daily payment streams to all coin holders
- **Automated Distribution** - Set stream rate once, earnings flow continuously (per second)
- **Creator-Friendly** - No complex smart contracts, simple UI for coin launches
- **Revenue Sharing** - Stream a portion of your daily earnings directly to your community

### **📊 Portfolio Tracker** (Supporting Tool)
- Monitor multiple creator coins across 5 EVM chains (Base, Ethereum, Optimism, Arbitrum, Polygon)
- Real-time token holdings and portfolio value tracking
- Transaction history from Etherscan + Moralis APIs
- Advanced P&L analysis with per-token breakdown
- Compact, professional UI inspired by Axiom
- Smart caching (5-10 minute TTL)
- Holder type classification (dev, insider, sniper, bot, regular)
- Portfolio diversity scoring and risk assessment

### **Key Differences from Axiom & BullX**
- **Axiom/BullX:** Focus on Solana memecoin tracking
- **YouBuidl:** Focus on Creator Economy coins on **EVM networks** (Base, Optimism, Arbitrum, Polygon, Ethereum)
- **YouBuidl Unique:** Built-in streaming for daily earnings distribution to coin holders

## 🛠️ Tech Stack

- **Frontend:** Next.js 15.5.7, React 18, TypeScript
- **Blockchain:** Viem 2.31.2, Wagmi, Superfluid SDK
- **APIs:** Moralis, Alchemy, Etherscan
- **Styling:** Tailwind CSS 4.1.10
- **Database:** PostgreSQL (optional)
- **State:** TanStack React Query, Context API, localStorage
- **Testing:** Vitest, React Testing Library

## 📋 Prerequisites

```
Node.js 18+
npm or yarn
.env.local with required API keys
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/kowksicoder/hamiltea.git
cd hamiltea
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create `.env.local`:
```bash
# Required APIs
NEXT_PUBLIC_MORALIS_API_KEY=your_moralis_jwt
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_key

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── tracker/              # Wallet tracker page
│   │   └── page.tsx          # Main tracker interface
│   ├── cfa/                  # Superfluid flows
│   ├── crowdfund/            # Fundraising
│   ├── launch/               # Token launch
│   ├── tokens/               # Token discovery
│   ├── leaderboard/          # User rankings
│   └── api/                  # API routes
│
├── components/
│   ├── tracker/
│   │   ├── PNLDisplay.tsx    # P&L visualization
│   │   ├── TransactionHistory.tsx  # Transaction list
│   │   ├── ChainSelector.tsx       # Chain selection UI
│   │   └── PortfolioSummary.tsx    # Stats cards
│   ├── Modal.tsx             # Reusable modal
│   ├── Navbar.tsx            # Navigation
│   └── ...
│
├── lib/
│   ├── pnlCalculator.ts      # P&L calculation engine
│   ├── transactionHistory.ts # API integrations (Etherscan, Moralis)
│   ├── tokenHoldings.ts      # Token balance fetching
│   ├── multiChainClient.ts   # Viem RPC client factory
│   ├── walletActivity.ts     # Transaction analysis
│   └── portfolioMetrics.ts   # Risk/diversity scoring
│
├── hooks/                    # Custom React hooks
├── contexts/                 # React contexts
└── constants/                # App constants
```

## 🔑 Getting API Keys

### Moralis
1. Visit https://moralis.io
2. Sign up (free tier available)
3. Create API key → copy JWT token
4. Add to `.env.local` as `NEXT_PUBLIC_MORALIS_API_KEY`

### Alchemy
1. Visit https://alchemy.com
2. Sign up (free tier: 300M compute units/month)
3. Create app → copy API key
4. Add to `.env.local` as `NEXT_PUBLIC_ALCHEMY_API_KEY`

### Etherscan
1. Visit https://etherscan.io/apis
2. Sign up
3. Create API key
4. Add to `.env.local` as `NEXT_PUBLIC_ETHERSCAN_API_KEY`

### WalletConnect (Optional)
1. Visit https://cloud.walletconnect.com
2. Create free account
3. Create project → copy Project ID
4. Add to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## 📊 Supported Networks

| Chain | Chain ID | RPC Provider | Status |
|-------|----------|--------------|--------|
| Base | 8453 | Superfluid | ✅ Production |
| Ethereum | 1 | Alchemy | ✅ Production |
| Optimism | 10 | Public RPC | ✅ Production |
| Arbitrum | 42161 | Public RPC | ✅ Production |
| Polygon | 137 | Public RPC | ✅ Production |

## 📚 Documentation

- **[Tracker Implementation](./TRACKER_IMPLEMENTATION_FINAL.md)** - Complete feature documentation
- **[UI/UX Design](./TRACKER_UI_REDESIGN.md)** - Interface improvements
- **[User Guide](./TRACKER_GUIDE.md)** - How to use the tracker
- **[Feature Overview](./TRACKER_FEATURES.md)** - Architecture & components
- **[P&L Calculator](./src/lib/pnlCalculator.ts)** - Algorithm details

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- stakers-count.test.ts
```

## 🚀 Building & Deployment

### Local Build
```bash
npm run build
npm run start
```

### Vercel (Recommended)
```bash
# Connect GitHub repo to Vercel
# Deploy with environment variables set in Vercel Dashboard
vercel deploy --prod
```

### Docker
```bash
# Build image
docker build -t youbuidl .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_MORALIS_API_KEY=your_key \
  -e NEXT_PUBLIC_ALCHEMY_API_KEY=your_key \
  -e NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key \
  youbuidl
```

## 🌐 API Endpoints

### Tracker APIs
- `GET /api/tracker/holdings` - Fetch wallet holdings
- `GET /api/tracker/transactions` - Transaction history
- `GET /api/tracker/pnl` - P&L calculations

### DeFi APIs
- `GET /api/tokens` - Token search
- `GET /api/swap` - Swap quotes
- `POST /api/stake` - Staking actions

## 💡 Usage Examples

### Monitor a Wallet
1. Go to `/tracker`
2. Click "+ Add Wallet"
3. Enter wallet address and label
4. Select chains to track
5. View holdings, transactions, and P&L

### Create a Stream
1. Go to `/cfa`
2. Enter recipient address and amount
3. Set flow rate (per second)
4. Confirm transaction
5. Monitor in "Active Streams"

### Analyze Performance
1. Open Tracker → P&L tab
2. View portfolio summary
3. Check per-token breakdown
4. Analyze entry vs current price
5. Export transaction history

## 🔒 Security

- ✅ No private keys stored (read-only operations)
- ✅ All API keys in environment variables
- ✅ Smart contract interactions via Viem
- ✅ Transaction signing via wallet providers
- ✅ localStorage encrypted for sensitive data

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing`
5. Open Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- [Superfluid](https://superfluid.finance) - Real-time payment protocol
- [Viem](https://viem.sh) - Ethereum client
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Streme.fun](https://streme.fun) - Original inspiration

## 📞 Contact

- GitHub: [@kowksicoder](https://github.com/kowksicoder)
- Issues: [Report a bug](https://github.com/kowksicoder/hamiltea/issues)
- Discussions: [Ask a question](https://github.com/kowksicoder/hamiltea/discussions)

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Wallet tracker across 5 chains
- [x] Transaction history & P&L
- [x] Superfluid streaming
- [x] Token discovery

### Phase 2 (Next) 🚀
- [ ] Real-time price charts
- [ ] Portfolio leaderboard
- [ ] Price alerts
- [ ] Advanced DeFi analytics
- [ ] Tax reporting tools

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] DAO governance
- [ ] NFT portfolio tracking
- [ ] Social features
- [ ] Machine learning predictions

---

**Built with ❤️ for the Web3 builder community**

*Last Updated: December 2025*
