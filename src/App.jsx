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

  // UI State
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayLoanNumber, setRepayLoanNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [liquidateAddress, setLiquidateAddress] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        showToast('Please install MetaMask to use this app', 'error');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Failed to connect wallet';
      showToast(errorMessage, 'error');
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
      
      showToast('Collateral deposited successfully!', 'success');
      setCollateralAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error depositing collateral:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Failed to deposit collateral';
      showToast(errorMessage, 'error');
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
      
      showToast('Stablecoin borrowed successfully!', 'success');
      setBorrowAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error borrowing stablecoin:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Transaction failed';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Repay loan
  const repayLoan = async () => {
    if (!collateralXContract || !testCoinContract || !repayAmount || !repayLoanNumber) return;
    
    try {
      setIsLoading(true);
      
      // First approve the contract to spend tokens
      const amount = ethers.parseEther(repayAmount);
      const approveTx = await testCoinContract.approve(CONFIG.COLLATERALX_ADDRESS, amount);
      await approveTx.wait();
      
      // Then repay the specified loan
      const loanIndex = parseInt(repayLoanNumber) - 1;
      const repayTx = await collateralXContract.repayStableCoin(amount, [loanIndex]);
      await repayTx.wait();
      
      showToast('Loan repaid successfully!', 'success');
      setRepayAmount('');
      setRepayLoanNumber('');
      loadUserData();
    } catch (error) {
      console.error('Error repaying loan:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Failed to repay loan';
      showToast(errorMessage, 'error');
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
      
      showToast('Collateral withdrawn successfully!', 'success');
      setWithdrawAmount('');
      loadUserData();
    } catch (error) {
      console.error('Error withdrawing collateral:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Failed to withdraw collateral';
      showToast(errorMessage, 'error');
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
      
      showToast('Position liquidated successfully!', 'success');
      setLiquidateAddress('');
      loadUserData();
    } catch (error) {
      console.error('Error liquidating position:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Failed to liquidate position';
      showToast(errorMessage, 'error');
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
      
      showToast('Test tokens received successfully!', 'success');
      loadUserData();
    } catch (error) {
      console.error('Error getting test tokens:', error);
      const revertReason = error.message.match(/"([^"]*)"/) || [];
      const errorMessage = revertReason[1] || 'Failed to get test tokens';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toast notification helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      // Removal animation for a toast after 5 seconds
      setToasts(prev => 
        prev.map(toast => 
          toast.id === id ? { ...toast, removing: true } : toast
        )
      );
      
      // Actually remove the toast after animation completes
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 300);
    }, 5000);
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
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type} ${toast.removing ? 'removing' : ''}`}>
            <div className="toast-message">{toast.message}</div>
            <button
              className="toast-close"
              onClick={() => {
                setToasts(prev => 
                  prev.map(t => 
                    t.id === toast.id ? { ...t, removing: true } : t
                  )
                );
                setTimeout(() => {
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                }, 300);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
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
            <>
              <div className={`stat-card ${isLoading ? 'skeleton' : ''}`}>
                <h3>Your Collateral</h3>
                <p>{parseFloat(userCollateral).toFixed(4)} ETH</p>
              </div>
              <div className={`stat-card ${isLoading ? 'skeleton' : ''}`}>
                <h3>Your Balance</h3>
                <p>{parseFloat(userTestCoinBalance).toFixed(2)} TC</p>
              </div>
              <div className={`stat-card ${isLoading ? 'skeleton' : ''}`}>
                <h3>Active Loans</h3>
                <p>{userLoans.length}</p>
              </div>
              <div className={`stat-card ${isLoading ? 'skeleton' : ''}`}>
                <h3>Contract Balance</h3>
                <p>{parseFloat(contractTestCoinBalance).toFixed(2)} TC</p>
              </div>
            </>
          </div>

          <div className="actions-grid">
            {/* Collateral Management */}
            <div className={`action-card ${isLoading ? 'skeleton' : ''}`}>
              <h3>Collateral Management</h3>
              <div className="input-group">
                <label>Deposit Collateral</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    step="0.01"
                  />
                  {!isLoading && <span className="unit-label">ETH</span>}
                  <button onClick={depositCollateral} disabled={isLoading || !collateralAmount}>
                    {isLoading ? 'Processing...' : 'Deposit'}
                  </button>
                </div>
                <div className="helper-text">Deposit ETH as collateral to borrow stablecoins</div>
              </div>
              <div className="input-group">
                <label>Withdraw Collateral</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    step="0.01"
                  />
                  {!isLoading && <span className="unit-label">ETH</span>}
                  <button onClick={withdrawCollateral} disabled={isLoading || !withdrawAmount}>
                    {isLoading ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
                <div className="helper-text">Withdraw your deposited ETH</div>
              </div>
            </div>

            {/* Borrowing */}
            <div className={`action-card ${isLoading ? 'skeleton' : ''}`}>
              <h3>Borrow Stablecoin</h3>
              <div className="input-group">
                <label>Borrow Stablecoin</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    step="1"
                  />
                  {!isLoading && <span className="unit-label">TC</span>}
                  <button onClick={borrowStableCoin} disabled={isLoading || !borrowAmount}>
                    {isLoading ? 'Processing...' : 'Borrow'}
                  </button>
                </div>
                <div className="helper-text">Borrow stablecoins against your ETH collateral</div>
              </div>
            </div>

            {/* Repayment */}
            <div className={`action-card ${isLoading ? 'skeleton' : ''}`}>
              <h3>Repay Loan</h3>
              <div className="input-group">
                <label>Loan Number</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    placeholder="Enter loan #"
                    value={repayLoanNumber}
                    onChange={(e) => setRepayLoanNumber(e.target.value)}
                    min="1"
                    max={userLoans.length}
                    step="1"
                  />
                </div>
                <div className="helper-text">Enter the loan number you want to repay (1-{userLoans.length})</div>
              </div>
              <div className="input-group">
                <label>Authorize Payment</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    step="1"
                  />
                  {!isLoading && <span className="unit-label">TC</span>}
                  <button onClick={repayLoan} disabled={isLoading || !repayAmount || !repayLoanNumber}>
                    {isLoading ? 'Processing...' : 'Repay'}
                  </button>
                </div>
                <div className="helper-text">Authorize enough stablecoins to repay the specified loan</div>
              </div>
            </div>

            {/* Liquidation */}
            <div className={`action-card ${isLoading ? 'skeleton' : ''}`}>
              <h3>Liquidate Position</h3>
              <div className="input-group">
                <label>Liquidate Position</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    value={liquidateAddress}
                    onChange={(e) => setLiquidateAddress(e.target.value)}
                  />
                  <button onClick={liquidatePosition} disabled={isLoading || !liquidateAddress}>
                    {isLoading ? 'Processing...' : 'Liquidate'}
                  </button>
                </div>
                <div className="helper-text">Liquidate undercollateralized positions to collect ETH</div>
              </div>
            </div>
          </div>

          {/* Loan Status */}
          {(userLoans.length > 0 || isLoading) && (
            <div className="loans-section">
              <h3>Your Loans</h3>
              <div className="loans-grid">
                {userLoans.map((loan, index) => (
                  <div key={index} className={`loan-card ${isLoading ? 'skeleton' : ''}`}>
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
