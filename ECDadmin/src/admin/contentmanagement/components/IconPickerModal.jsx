import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import * as FeatherIcons from 'react-feather'; // Using feather icons as seen in your screenshot

const IconPickerModal = ({ open, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all icon names from the library
  const iconList = Object.keys(FeatherIcons);

  const filteredIcons = iconList.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="flex justify-between items-center border-b p-4">
        <span className="text-teal-600 font-medium text-lg">Icons</span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon className="text-teal-600" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="p-6 bg-gray-50">
        <div className="flex justify-center mb-8">
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search Icons..."
            className="w-1/3 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
            }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
          {filteredIcons.map((iconName) => {
            const Icon = FeatherIcons[iconName];
            return (
              <div 
                key={iconName}
                onClick={() => onSelect(iconName)}
                className="bg-white p-4 flex flex-col items-center justify-center border border-gray-100 rounded-md cursor-pointer hover:shadow-md hover:border-teal-500 transition-all group"
              >
                <Icon size={24} className="text-gray-600 group-hover:text-teal-500 mb-2" />
                <Typography className="text-[10px] text-gray-400 text-center truncate w-full">
                  {iconName}
                </Typography>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconPickerModal;