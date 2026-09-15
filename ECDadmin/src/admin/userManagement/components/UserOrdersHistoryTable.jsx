import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import SideNav from './SideNav.jsx';

const UserOrderHistoryTable = () => {
  const { userId } = useParams(); // ✅ SOURCE OF TRUTH
  const [perPage, setPerPage] = useState(10);

  // Defensive guard (optional but smart)
  if (!userId) {
    return <div className="p-6 text-red-500">Invalid user</div>;
  }

  // Mock Data
  const orders = [
    {
      id: 1,
      orderId: 'DW1908',
      restaurant: 'Legligin',
      status: 'Abandon',
      total: 'RM 33.08',
      date: 'December 27th 2025, 7:25:43 am'
    },
    {
      id: 2,
      orderId: 'DW1909',
      restaurant: 'Legligin',
      status: 'New',
      total: 'RM 33.08',
      date: 'December 27th 2025, 7:25:54 am'
    }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Abandon':
        return 'bg-gray-500 text-white';
      case 'New':
        return 'bg-teal-50 text-teal-600 border border-teal-100';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-row gap-6 items-start">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <SideNav userId={userId} />
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-gray-700 font-medium mb-4 text-lg">
            Total Orders : {orders.length}
          </h2>

          <TableContainer
            component={Paper}
            elevation={0}
            className="border border-gray-100 rounded-none"
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead className="bg-[#f8f9fc]">
                <TableRow>
                  {[
                    'INDEX',
                    'ORDER ID',
                    'RESTAURANT',
                    'ORDER STATUS',
                    'TOTAL',
                    'ORDERED ON'
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#6b7280',
                        borderRight: '1px solid #f3f4f6'
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>{order.restaurant}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell>{order.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Per page</span>
              <Select
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
                size="small"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button><ChevronsLeft size={16} /></button>
              <button><ChevronLeft size={16} /></button>
              <button className="w-8 h-8 bg-teal-600 text-white rounded-full">
                1
              </button>
              <button><ChevronRight size={16} /></button>
              <button><ChevronsRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderHistoryTable;
