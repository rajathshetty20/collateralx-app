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
- Real-time ETH/USD price feeds via Chainlink

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Connect MetaMask to Sepolia network

3. Start the app:
```bash
npm run dev
```

## Local Development
For local development, refer to the [CollateralX Protocol Repository](https://github.com/rajathshetty20/collateralx-protocol) for instructions on deploying contracts locally.

## Project Structure

```
src/
├── abi/         # Contract ABIs
├── config.js    # Network & contract config
├── App.jsx      # Main UI component
└── App.css      # Styling
```

## Security Notes

- Maintain >150% collateral ratio
- Positions below 120% can be liquidated
- Interest accumulates over time
- Uses Chainlink's trusted price feeds for accurate ETH valuation
- Test with small amounts first
- Verify contract addresses

## License

MIT