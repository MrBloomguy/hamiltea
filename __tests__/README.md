# Test Suite Documentation - YouBuidl Creator Streaming Platform

This test suite provides comprehensive testing for the **YouBuidl Creator Streaming Platform** - where creators launch coins and stream daily earnings to their communities.

## Overview

The test suite covers:
- ✅ React components with Web3 interactions
- ✅ Custom hooks for data fetching and state management
- ✅ API routes and external integrations
- ✅ Utility functions and business logic
- ✅ Error handling and edge cases

## Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── tracker/        # Tracker component tests
│   └── ...
├── hooks/              # Custom hook tests
│   └── useTokenData.test.ts
├── api/                # API route tests
│   ├── tokens.test.ts
│   └── quote.test.ts
├── lib/                # Utility function tests
│   ├── pnlCalculator.test.ts      # P&L calculation tests
│   ├── tokenHoldings.test.ts      # Token holding tests
│   └── apiUtils.test.ts
├── utils/              # Test utilities
│   ├── mockData.ts     # Mock wallet & transaction data
│   ├── mswHandlers.ts  # API mocking handlers
│   └── web3Mocks.ts    # Web3 mocking utilities
└── README.md           # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tracker.test.ts

# Run tests matching pattern
npm test -- --grep "P&L"
```

## Key Testing Patterns

### 1. Wallet Tracking Tests

Tests for multi-chain wallet holdings and portfolio tracking:

```typescript
import { fetchWalletTokenHoldings } from '@/lib/tokenHoldings'
import { MOCK_WALLET_ADDRESS } from '../utils/mockData'

describe('Wallet Tracking', () => {
  it('fetches holdings across multiple chains', async () => {
    const holdings = await fetchWalletTokenHoldings(MOCK_WALLET_ADDRESS, 'ethereum')
    expect(holdings).toHaveLength(greaterThan(0))
    expect(holdings[0]).toHaveProperty('symbol')
    expect(holdings[0]).toHaveProperty('balanceUSD')
  })
})
```

### 2. P&L Calculation Tests

Tests for transaction parsing and profit/loss calculations:

```typescript
import { calculatePortfolioPNL, parseTradesFromTransactions } from '@/lib/pnlCalculator'
import { mockTransactions } from '../utils/mockData'

describe('P&L Calculator', () => {
  it('calculates portfolio P&L accurately', async () => {
    const pnl = await calculatePortfolioPNL(mockTransactions)
    expect(pnl.unrealizedPNL).toBeGreaterThanOrEqual(0)
    expect(pnl.tokens).toHaveLength(greaterThan(0))
  })

  it('identifies buy and sell trades', () => {
    const trades = parseTradesFromTransactions(mockTransactions)
    expect(trades.size).toBeGreaterThan(0)
  })
})
```

### 3. Transaction History Tests

Tests for API integration with Etherscan and Moralis:

```typescript
import { fetchCompleteWalletHistory, getCachedWalletHistory } from '@/lib/transactionHistory'

describe('Transaction History', () => {
  it('fetches complete wallet history from APIs', async () => {
    const txs = await fetchCompleteWalletHistory(MOCK_ADDRESS, 'ethereum')
    expect(txs).toBeArray()
    expect(txs[0]).toHaveProperty('hash')
    expect(txs[0]).toHaveProperty('tokenSymbol')
  })

  it('uses cache to prevent API calls', () => {
    const cached = getCachedWalletHistory(MOCK_ADDRESS, 'ethereum')
    // Cache should be available from previous test
  })
})
```

### 4. Component Tests

Tests for React components with Web3 interactions:

```typescript
import { render, screen } from '@testing-library/react'
import { PNLDisplay } from '@/components/tracker/PNLDisplay'

describe('PNLDisplay Component', () => {
  it('renders portfolio summary', async () => {
    render(<PNLDisplay walletAddress={MOCK_ADDRESS} chainId="ethereum" />)
    
    // Wait for data to load
    const valueText = await screen.findByText(/Total Value/i)
    expect(valueText).toBeInTheDocument()
  })

  it('shows per-token P&L breakdown', async () => {
    const { container } = render(
      <PNLDisplay walletAddress={MOCK_ADDRESS} chainId="ethereum" />
    )
    
    const tokenRows = container.querySelectorAll('[role="row"]')
    expect(tokenRows.length).toBeGreaterThan(1)
  })
})
```

### 5. API Route Tests

Tests for Next.js API routes:

```typescript
import { GET } from '@/app/api/tokens/route'
import { NextRequest } from 'next/server'

describe('API Routes', () => {
  it('returns token list', async () => {
    const request = new NextRequest('http://localhost:3000/api/tokens')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data).toHaveProperty('tokens')
    expect(data.tokens).toBeArray()
  })

  it('handles missing parameters gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/tokens?invalid=true')
    const response = await GET(request)
    
    expect(response.status).toBeLessThanOrEqual(400)
  })
})
```

## Mock Strategy

### Web3 Mocking
- **Viem Clients:** Mocked with realistic contract read/write responses
- **Wallet Providers:** Mocked with address and transaction capabilities
- **RPC Calls:** Simulated for ERC-20 balance queries
- **Gas Simulation:** Estimated values for transaction costs

### API Mocking
- **Etherscan API:** Transaction history mock data
- **Moralis API:** Token price and transfer mocks
- **Alchemy API:** Enhanced data mocks
- **Rate Limiting:** Simulated for realistic testing

### Data Mocking
- **Mock Wallets:** `MOCK_WALLET_ADDRESS`, `MOCK_RECIPIENT`
- **Mock Tokens:** USDC, WETH, DAI, USDT across chains
- **Mock Transactions:** Buy/sell/swap/transfer events
- **Mock Prices:** Realistic token prices from Moralis

### localStorage Mocking

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
```

## Test Coverage Goals

Target coverage metrics:
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

Current coverage: Run `npm run test:coverage` to view

## Continuous Integration

Tests run automatically on:
- Git push to `main` branch
- Pull requests
- Scheduled nightly runs

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Debugging Tests

### Enable Debug Output
```bash
DEBUG=app:* npm test
```

### Run Single Test
```bash
npm test -- --testNamePattern="P&L calculation"
```

### Watch Specific File
```bash
npm test -- --watch src/lib/pnlCalculator.ts
```

### Interactive Debugging
```bash
node --inspect-brk node_modules/.bin/vitest
```

## Common Issues & Solutions

### Issue: Mock data not updating
**Solution:** Clear cache between tests
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
```

### Issue: Async tests timing out
**Solution:** Increase timeout for slow operations
```typescript
it('fetches data', async () => {
  // ... test code
}, { timeout: 10000 })
```

### Issue: API mocks not intercepting
**Solution:** Ensure MSW handlers are registered before tests
```typescript
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Best Practices

1. **Isolation:** Each test should be independent
2. **Clarity:** Test names clearly describe what is being tested
3. **Coverage:** Aim for high coverage on critical paths
4. **Mocking:** Mock external dependencies (APIs, databases)
5. **Performance:** Keep tests fast (< 100ms each)
6. **Cleanup:** Always cleanup after tests (close connections, etc.)

## Adding New Tests

1. Create test file in appropriate directory: `path/to/feature.test.ts`
2. Import test utilities and mocks
3. Write test cases using Vitest syntax
4. Run tests: `npm test -- path/to/feature.test.ts`
5. Update coverage targets if needed

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Mock Service Worker](https://mswjs.io)
- [Web3 Testing Best Practices](https://docs.ethers.org/v5/testing/)

---

**Last Updated:** December 2025  
**Platform:** YouBuidl - Web3 Trading & Streaming