import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CollateralXABI from './abi/CollateralX.json';
import TestCoinABI from './abi/TestCoin.json';
import { CONFIG } from './config';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [collateralXContract, setCollateralXContract] = useState(null);
  const [testCoinContract, setTestCoinContract] = useState(null);
  
  // Contract State
  const [userCollateral, setUserCollateral] = useState('0');
  const [userLoans, setUserLoans] = useState([]);
  const [userTestCoinBalance, setUserTestCoinBalance] = useState('0');
  const [contractTestCoinBalance, setContractTestCoinBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // UI State
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [liquidateAddress, setLiquidateAddress] = useState('');

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        
        setAccount(account);
        
        const collateralX = new ethers.Contract(CONFIG.COLLATERALX_ADDRESS, CollateralXABI.abi, signer);
        const testCoin = new ethers.Contract(CONFIG.TESTCOIN_ADDRESS, TestCoinABI.abi, signer);
        
        setCollateralXContract(collateralX);
        setTestCoinContract(testCoin);
        
        loadUserData();
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet');
    }
  };

  // Load user data
  const loadUserData = async () => {
    if (!account || !collateralXContract || !testCoinContract) return;
    
    try {
      setIsLoading(true);
      
      const collateral = await collateralXContract.loanAccounts(account);
      setUserCollateral(ethers.formatEther(collateral));
      
      const loans = await collateralXContract.getLoanStatus(account);
      setUserLoans(loans);
      
      const testCoinBalance = await testCoinContract.balanceOf(account);
      setUserTestCoinBalance(ethers.formatEther(testCoinBalance));
      
      const contractBalance = await testCoinContract.balanceOf(CONFIG.COLLATERALX_ADDRESS);
      setContractTestCoinBalance(ethers.formatEther(contractBalance));
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit collateral
  const depositCollateral = async () => {
    if (!collateralXContract || !collateralAmount) return;
    
    try {
      setIsLoading(true);
      const amount = ethers.parseEther(collateralAmount);
      const tx = await collateralXContract.depositCollateral({ value: amount });
      await tx.wait();
      
      alert('Collateral deposited successfully!');
      setCollateralAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error depositing collateral:', error);
      alert('Error depositing collateral: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Borrow stablecoin
  const borrowStableCoin = async () => {
    if (!collateralXContract || !borrowAmount) return;
    
    try {
      setIsLoading(true);
      const amount = ethers.parseEther(borrowAmount);
      const tx = await collateralXContract.borrowStableCoin(amount);
      await tx.wait();
      
      alert('Stablecoin borrowed successfully!');
      setBorrowAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error borrowing stablecoin:', error);
      alert('Error borrowing stablecoin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Repay loan
  const repayLoan = async () => {
    if (!collateralXContract || !testCoinContract || !repayAmount) return;
    
    try {
      setIsLoading(true);
      
      // First approve the contract to spend tokens
      const amount = ethers.parseEther(repayAmount);
      const approveTx = await testCoinContract.approve(CONFIG.COLLATERALX_ADDRESS, amount);
      await approveTx.wait();
      
      // Then repay the loan (repaying the first loan for simplicity)
      const repayTx = await collateralXContract.repayStableCoin(amount, [0]);
      await repayTx.wait();
      
      alert('Loan repaid successfully!');
      setRepayAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error repaying loan:', error);
      alert('Error repaying loan: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw collateral
  const withdrawCollateral = async () => {
    if (!collateralXContract || !withdrawAmount) return;
    
    try {
      setIsLoading(true);
      const amount = ethers.parseEther(withdrawAmount);
      const tx = await collateralXContract.withdrawCollateral(amount);
      await tx.wait();
      
      alert('Collateral withdrawn successfully!');
      setWithdrawAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error withdrawing collateral:', error);
      alert('Error withdrawing collateral: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Liquidate position
  const liquidatePosition = async () => {
    if (!collateralXContract || !liquidateAddress) return;
    
    try {
      setIsLoading(true);
      const tx = await collateralXContract.liquidate(liquidateAddress);
      await tx.wait();
      
      alert('Position liquidated successfully!');
      setLiquidateAddress('');
      loadUserData();
    } catch (error) {
      console.error('Error liquidating position:', error);
      alert('Error liquidating position: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Faucet function for testing
  const getTestTokens = async () => {
    if (!testCoinContract) return;
    
    try {
      setIsLoading(true);
      const tx = await testCoinContract.faucet(account, ethers.parseEther("1000"));
      await tx.wait();
      
      alert('Test tokens received!');
      loadUserData();
    } catch (error) {
      console.error('Error getting test tokens:', error);
      alert('Error getting test tokens: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadUserData();
    }
  }, [account]);

  if (!account) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>CollateralX Protocol</h1>
          <p>DeFi Lending and Borrowing Platform</p>
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>CollateralX Protocol</h1>
        <div className="wallet-info">
          <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
          <button onClick={getTestTokens} className="faucet-btn" disabled={isLoading}>
            Get Test Tokens
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Your Collateral</h3>
              <p>{parseFloat(userCollateral).toFixed(4)} ETH</p>
            </div>
            <div className="stat-card">
              <h3>TestCoin Balance</h3>
              <p>{parseFloat(userTestCoinBalance).toFixed(2)} TC</p>
            </div>
            <div className="stat-card">
              <h3>Active Loans</h3>
              <p>{userLoans.length}</p>
            </div>
            <div className="stat-card">
              <h3>Contract Balance</h3>
              <p>{parseFloat(contractTestCoinBalance).toFixed(2)} TC</p>
            </div>
          </div>

          <div className="actions-grid">
            {/* Collateral Management */}
            <div className="action-card">
              <h3>Collateral Management</h3>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  step="0.01"
                />
                <button onClick={depositCollateral} disabled={isLoading || !collateralAmount}>
                  {isLoading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  step="0.01"
                />
                <button onClick={withdrawCollateral} disabled={isLoading || !withdrawAmount}>
                  {isLoading ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </div>

            {/* Borrowing */}
            <div className="action-card">
              <h3>Borrow Stablecoin</h3>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount in TC"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  step="1"
                />
                <button onClick={borrowStableCoin} disabled={isLoading || !borrowAmount}>
                  {isLoading ? 'Processing...' : 'Borrow'}
                </button>
              </div>
            </div>

            {/* Repayment */}
            <div className="action-card">
              <h3>Repay Loan</h3>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount in TC"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  step="1"
                />
                <button onClick={repayLoan} disabled={isLoading || !repayAmount}>
                  {isLoading ? 'Processing...' : 'Repay'}
                </button>
              </div>
            </div>

            {/* Liquidation */}
            <div className="action-card">
              <h3>Liquidate Position</h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Address to liquidate"
                  value={liquidateAddress}
                  onChange={(e) => setLiquidateAddress(e.target.value)}
                />
                <button onClick={liquidatePosition} disabled={isLoading || !liquidateAddress}>
                  {isLoading ? 'Processing...' : 'Liquidate'}
                </button>
              </div>
            </div>
          </div>

          {/* Loan Status */}
          {userLoans.length > 0 && (
            <div className="loans-section">
              <h3>Your Loans</h3>
              <div className="loans-grid">
                {userLoans.map((loan, index) => (
                  <div key={index} className="loan-card">
                    <h4>Loan #{index + 1}</h4>
                    <p><strong>Principal:</strong> {ethers.formatEther(loan.principal)} TC</p>
                    <p><strong>Interest:</strong> {ethers.formatEther(loan.interest)} TC</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
