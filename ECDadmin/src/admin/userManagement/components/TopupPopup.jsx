import React from 'react';
import { Dialog, IconButton } from '@mui/material';
import { Close, PlayCircleOutline } from '@mui/icons-material';

const TopupPopup = ({
  open,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        className: "rounded-2xl overflow-hidden",
      }}
    >
      <div className="bg-white p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-gray-600 text-xl font-semibold">
            Enter The Amount Topup
          </h2>
          <IconButton onClick={onClose} size="small">
            <Close className="text-gray-400" />
          </IconButton>
        </div>

        {/* Video */}
        <div className="flex justify-end mb-2">
          <button className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-gray-800 text-sm py-1 px-3 rounded-md transition-colors border border-amber-200">
            <PlayCircleOutline fontSize="small" />
            <span className="font-medium">Video Tutorial</span>
          </button>
        </div>

        {/* Input */}
        <div className="mb-8">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Amount"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder-gray-300"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default TopupPopup;
