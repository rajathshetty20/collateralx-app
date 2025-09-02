# CollateralX UI

React interface for the CollateralX lending protocol, allowing users to deposit ETH as collateral and borrow stablecoins against it.

BE: https://github.com/rajathshetty20/collateralx-protocol

## Features

- Deposit ETH as collateral
- Borrow stablecoins (150% collateral ratio)
- Multiple loans per collateral
- Flexible loan repayment
- Liquidation (120% threshold)
- 10% annual interest rate

## Quick Start

```bash
# Install dependencies
npm install

# Update contract addresses in src/config.js
export const CONFIG = {
  COLLATERALX_ADDRESS: "YOUR_DEPLOYED_ADDRESS",
  TESTCOIN_ADDRESS: "YOUR_DEPLOYED_ADDRESS"
};

# Start development server
npm run dev
```

## Prerequisites

- Node.js
- MetaMask
- Local Hardhat network or other Ethereum network


## Local Development

1. Start local blockchain:
```bash
# In collateralx-protocol directory
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

2. Configure network in MetaMask:
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency: `ETH`

## Project Structure

```
src/
├── abi/         # Contract ABIs
├── config.js    # Network & contract config
├── App.jsx      # Main UI component
└── App.css      # Styling
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint

## Security Notes

- Maintain >150% collateral ratio
- Positions below 120% can be liquidated
- Interest accumulates over time
- Test with small amounts first
- Verify contract addresses

## License

MIT
