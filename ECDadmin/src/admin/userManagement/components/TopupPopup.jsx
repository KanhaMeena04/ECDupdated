import React from 'react';
import { Dialog, IconButton } from '@mui/material';
import { Close, AccountBalanceWallet } from '@mui/icons-material';

const TopupPopup = ({
  open,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
  user = null,
  loading = false,
}) => {
  const quickAmounts = [100, 200, 500, 1000, 2000];

  const handleQuickAdd = (val) => {
    const current = Number(amount) || 0;
    onAmountChange(String(current + val));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        style: { borderRadius: '20px', overflow: 'hidden' },
        className: "shadow-2xl",
      }}
    >
      <div className="bg-white p-6 relative font-sans text-gray-800" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <AccountBalanceWallet fontSize="small" />
            </div>
            <div>
              <h2 className="text-gray-900 text-lg font-bold">
                Wallet Top-up
              </h2>
              <p className="text-xs text-gray-500">
                Add funds directly to user's wallet
              </p>
            </div>
          </div>
          <IconButton 
            onClick={onClose} 
            size="small"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Close fontSize="small" />
          </IconButton>
        </div>

        {/* User Info Card if available */}
        {user && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-gray-800">
                {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.name || 'User'}
              </span>
              <div className="text-gray-500 text-[11px] mt-0.5">
                {user.mobile || user.phone || user.email || 'Customer'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase font-medium">Current Balance</div>
              <div className="font-bold text-emerald-600 text-sm">
                {user.wallet || `₹${(user.walletBalance || 0).toFixed(2)}`}
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Enter Top-up Amount
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 font-bold text-lg">
              ₹
            </div>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              autoFocus
              style={{
                backgroundColor: '#ffffff',
                color: '#111827',
              }}
              className="w-full pl-9 pr-4 py-3 bg-white text-gray-900 text-lg font-semibold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="mt-3">
          <div className="text-[11px] text-gray-500 mb-1.5 font-medium">Quick add:</div>
          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAdd(val)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 active:scale-95 transition-all"
              >
                +₹{val}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onAmountChange('')}
              className="px-2 py-1 text-[11px] font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !amount || Number(amount) <= 0}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <span>Add ₹{Number(amount) > 0 ? Number(amount).toLocaleString('en-IN') : '0'}</span>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default TopupPopup;
