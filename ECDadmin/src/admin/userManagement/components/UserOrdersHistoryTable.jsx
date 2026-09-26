import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Chip
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingBag
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../../utils/utils';
import { getName, formatOrderId } from '../../../utils/orderData';
import SideNav from './SideNav.jsx';

const UserOrderHistoryTable = () => {
  const { id: paramId, userId: propUserId } = useParams();
  const userId = paramId || propUserId;
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUserOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE_URL}/api/orders/admin/all`, {
          params: { userId, page, limit: perPage },
          withCredentials: true,
        });

        const list = Array.isArray(res.data?.orders)
          ? res.data.orders
          : Array.isArray(res.data)
          ? res.data
          : [];

        setOrders(list);
        setTotal(res.data?.total || list.length);
      } catch (err) {
        console.error('Fetch user orders failed:', err);
        setError(err.response?.data?.message || 'Failed to load user order history');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [userId, page, perPage]);

  if (!userId) {
    return <div className="p-6 text-red-500 font-bold">Invalid user ID specified.</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
      case 'failed':
        return 'error';
      case 'preparing':
      case 'accepted':
      case 'ready':
      case 'picked_up':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <SideNav userId={userId} />
        </div>

        {/* Content */}
        <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <ShoppingBag size={20} className="text-red-500" />
              Total Orders : {total}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <CircularProgress size={40} sx={{ color: '#ed2026' }} />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500 font-medium">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-2 opacity-30" />
              <p>No order history found for this user in the live database.</p>
            </div>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              className="border border-gray-100 rounded-lg overflow-hidden"
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead className="bg-gray-50">
                  <TableRow>
                    {[
                      '#',
                      'ORDER ID',
                      'RESTAURANT',
                      'ORDER STATUS',
                      'TOTAL',
                      'ORDERED ON',
                      'ACTION'
                    ].map((head) => (
                      <TableCell
                        key={head}
                        sx={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#6b7280',
                        }}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orders.map((order, idx) => (
                    <TableRow
                      key={order._id || idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>{(page - 1) * perPage + idx + 1}</TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatOrderId(order)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {order.restaurant?.name ? getName(order.restaurant.name) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(order.status || 'Pending').toUpperCase()}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ fontWeight: 'bold', fontSize: '11px' }}
                        />
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">
                        ₹ {Number(order.totalAmount || order.itemTotal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/view-order/${order._id}`)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs rounded transition"
                        >
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Per page</span>
              <Select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                size="small"
                sx={{ height: 34 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-1 disabled:opacity-30 hover:bg-white rounded-full transition"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 disabled:opacity-30 hover:bg-white rounded-full transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 disabled:opacity-30 hover:bg-white rounded-full transition"
              >
                <ChevronRight size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1 disabled:opacity-30 hover:bg-white rounded-full transition"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderHistoryTable;
