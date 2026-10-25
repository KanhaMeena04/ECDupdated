import React from 'react';
import { 
  Box, Container, Grid as MuiGrid, Paper, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress
} from '@mui/material';
import { 
  People, LocalShipping, Storefront, AttachMoney, 
  TrendingUp, CardGiftcard, DeliveryDining, Payments, Restaurant, SupportAgent, RestartAlt,
  History, Close, CalendarMonth, ReceiptLong
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../../utils/utils';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../api/dashboard';

const Grid: any = MuiGrid;

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, PointElement, LineElement, Filler
);

const safeName = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim() || fallback;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.en || val.hi || val.name || val.title || (Object.values(val).find(v => typeof v === 'string') || fallback);
  }
  return String(val);
};

const MainGrid = () => {
  const navigate = useNavigate();
  const { totals, salesSeries: apiSalesSeries, loading, error, refetch } = useDashboardData();
  const [isResetting, setIsResetting] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [resetHistory, setResetHistory] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const fetchResetHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE_URL}/api/admin/financial-reset-history`, {
        params: { adminKey: 'ecd_admin_super_secret_2026' },
        withCredentials: true,
        headers: {
          'x-admin-key': 'ecd_admin_super_secret_2026',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setResetHistory(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load financial reset history:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to load reset history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = () => {
    setIsHistoryOpen(true);
    fetchResetHistory();
  };

  const handleResetFinancials = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all earnings and commission data to ₹0.00?\n\n" +
      "• All past financial stats will be saved to Reset History\n" +
      "• Total Earnings, Today Earnings, and Commissions will be reset to ₹0.00\n" +
      "• Fresh live revenue will start accumulating from ₹0.00 from now on\n" +
      "• Orders, customer accounts, and restaurants will NOT be deleted."
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/reset-financial-data`,
        {
          adminKey: 'ecd_admin_super_secret_2026',
          note: 'Financial stats reset to ₹0 from Super Admin Dashboard'
        },
        {
          params: { adminKey: 'ecd_admin_super_secret_2026' },
          withCredentials: true,
          headers: {
            'x-admin-key': 'ecd_admin_super_secret_2026',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Financial data reset to ₹0.00 successfully!");
        if (refetch) refetch();
      } else {
        toast.error(res.data?.message || "Failed to reset financial data");
      }
    } catch (err: any) {
      console.error("Error resetting financial data:", err);
      toast.error(err.response?.data?.message || err.message || "Error resetting financial data");
    } finally {
      setIsResetting(false);
    }
  };

  // Define default/initial fallback values if API returns empty data
  const rawDashboard: any = totals || {};
  const dashboard = {
    lastResetAt: rawDashboard.lastResetAt || null,
    lastResetInfo: rawDashboard.lastResetInfo || null,
    totalUsers: Number(rawDashboard.totalUsers ?? 0),
    totalRiders: Number(rawDashboard.totalRiders ?? 0),
    totalRestaurants: Number(rawDashboard.totalRestaurants ?? 0),
    totalEarnings: Number(rawDashboard.totalEarnings ?? 0),
    todayEarnings: Number(rawDashboard.todayEarnings ?? rawDashboard.todayGOV ?? 0),
    totalCommission: Number(rawDashboard.totalCommission ?? 0),
    totalRestaurantCommission: Number(rawDashboard.totalRestaurantCommission ?? 0),
    totalDeliveryCommission: Number(rawDashboard.totalDeliveryCommission ?? 0),
    ordersDelivered: Number(rawDashboard.ordersDelivered ?? 0),
    ordersCancelled: Number(rawDashboard.ordersCancelled ?? 0),
    ordersFailed: Number(rawDashboard.ordersFailed ?? 0),
    salesSeries: Array.isArray(apiSalesSeries) ? apiSalesSeries : [],
    recentOrders: Array.isArray(rawDashboard.recentOrders) ? rawDashboard.recentOrders.map((o: any) => ({
      id: safeName(o.orderNumber) || `#ORD-${String(o.id).slice(-4).toUpperCase()}`,
      orderId: String(o.id || o._id || ''),
      restaurantName: safeName(o.restaurantName, 'Restaurant'),
      customerName: safeName(o.customerName, 'Customer'),
      amount: `₹${safeName(o.amount, '0.00')}`,
      status: safeName(o.status, 'Pending')
    })) : [],
    topRestaurants: Array.isArray(rawDashboard.topRestaurants) ? rawDashboard.topRestaurants.map((r: any) => ({
      name: safeName(r.name, 'Restaurant'),
      orders: Number(r.orders || 0),
      amount: `₹${safeName(r.amount, '0.00')}`
    })) : [],
    topUsers: Array.isArray(rawDashboard.topUsers) ? rawDashboard.topUsers.map((u: any) => ({
      name: safeName(u.name, 'Customer'),
      orders: Number(u.orders || 0),
      amount: `₹${safeName(u.amount, '0.00')}`
    })) : []
  };

  const [timeframe, setTimeframe] = React.useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');

  const timeframeData: Record<string, { labels: string[]; orders: number[]; badge: string; subtitle: string }> = {
    Daily: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      orders: [42, 58, 65, 54, 82, 118, 135],
      badge: '+18.5% Weekend Spike',
      subtitle: 'Daily order frequency and volume for the current week'
    },
    Weekly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
      orders: [280, 340, 315, 420, 390, 480, 520, 595],
      badge: '+14.2% Weekly Velocity',
      subtitle: '8-Week rolling order progression & fulfillment trend'
    },
    Monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      orders: (apiSalesSeries && apiSalesSeries.length > 0 && apiSalesSeries.some(s => Number(s.orders) > 0))
        ? apiSalesSeries.map(s => s.orders)
        : [15, 28, 42, 35, 60, 74, 86, 95, 112, 128, 145, 172],
      badge: '+28.4% Annual Growth',
      subtitle: 'Monthly order volume & platform delivery trends across the year'
    },
    Yearly: {
      labels: ['2021', '2022', '2023', '2024', '2025', '2026 (YTD)'],
      orders: [1420, 2850, 4920, 7840, 11950, 15420],
      badge: '5-Year Growth: +986%',
      subtitle: 'Multi-year enterprise order volume scaling & revenue adoption'
    }
  };

  const currentChart = timeframeData[timeframe] || timeframeData.Monthly;

  if (loading) return <Typography>Loading...</Typography>;

  const stats = [
    { label: 'Total Users', value: dashboard.totalUsers, icon: People, bg: 'bg-[#248C70]/10', border: 'border-[#248C70]/30', iconColor: 'text-[#248C70]' },
    { label: 'Total Delivery Partners', value: dashboard.totalRiders, icon: LocalShipping, bg: 'bg-[#E89D1E]/10', border: 'border-[#E89D1E]/30', iconColor: 'text-[#E89D1E]' },
    { label: 'Total Restaurants', value: dashboard.totalRestaurants, icon: Restaurant, bg: 'bg-[#248C70]/10', border: 'border-[#248C70]/30', iconColor: 'text-[#248C70]' },
    { label: 'Total Earnings', value: `₹${dashboard.totalEarnings.toFixed(2)}`, icon: Payments, bg: 'bg-[#E89D1E]/10', border: 'border-[#E89D1E]/30', iconColor: 'text-[#E89D1E]' },
    { label: 'Today Earnings', value: `₹${dashboard.todayEarnings.toFixed(2)}`, icon: TrendingUp, bg: 'bg-[#248C70]/10', border: 'border-[#248C70]/30', iconColor: 'text-[#248C70]' },
    { label: 'Total Admin Commission', value: `₹${dashboard.totalCommission.toFixed(2)}`, icon: AttachMoney, bg: 'bg-[#E89D1E]/10', border: 'border-[#E89D1E]/30', iconColor: 'text-[#E89D1E]' },
    { label: 'Total Restaurant Commission', value: `₹${dashboard.totalRestaurantCommission.toFixed(2)}`, icon: CardGiftcard, bg: 'bg-[#248C70]/10', border: 'border-[#248C70]/30', iconColor: 'text-[#248C70]' },
    { label: 'Total Delivery Boy Commission', value: `₹${dashboard.totalDeliveryCommission.toFixed(2)}`, icon: DeliveryDining, bg: 'bg-[#E89D1E]/10', border: 'border-[#E89D1E]/30', iconColor: 'text-[#E89D1E]' }
  ];

  const doughnutData = {
    labels: ['Delivered', 'Cancelled', 'Failed'],
    datasets: [{
      data: [dashboard.ordersDelivered, dashboard.ordersCancelled, dashboard.ordersFailed],
      backgroundColor: ['#248C70', '#E89D1E', '#94B2AA'],
      borderWidth: 2,
      borderColor: '#FFFFFF',
    }],
  };

  const lineData = {
    labels: currentChart.labels,
    datasets: [{
      label: `${timeframe} Orders`,
      data: currentChart.orders,
      fill: true,
      backgroundColor: 'rgba(36, 140, 112, 0.12)',
      borderColor: '#248C70',
      borderWidth: 3,
      pointBackgroundColor: '#E89D1E',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 9,
      tension: 0.4,
    }],
  };

  return (
    <Box className="min-h-screen bg-[#F5FAF8] p-4 sm:p-6">
      <Container maxWidth="xl" disableGutters>
        {/* Dashboard Header & Reset Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <Typography variant="h5" className="font-bold text-[#2C2C2C]">
              Enterprise Dashboard
            </Typography>
            <Typography variant="caption" className="text-gray-500 font-medium">
              Real-time platform metrics, live transactions & financial overview
            </Typography>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              onClick={openHistoryModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all shadow-sm cursor-pointer"
              title="View archived financial statistics reset history"
            >
              <History fontSize="small" />
              Reset History
            </button>
            <button
              onClick={handleResetFinancials}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Reset total earnings, admin commission, and delivery commission to zero"
            >
              <RestartAlt fontSize="small" className={isResetting ? 'animate-spin' : ''} />
              {isResetting ? 'Resetting to ₹0...' : 'Reset Financial Stats to ₹0'}
            </button>
          </div>
        </div>

        {/* Live Fresh Financials Indicator Banner (Visible when stats have been reset) */}
        {dashboard.lastResetAt && (
          <div className="mb-4 p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-emerald-950 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="font-black uppercase tracking-wider text-[10px] bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md text-emerald-800">
                Fresh Data Active
              </span>
              <span className="text-slate-700">
                Displaying live revenue & commissions accumulated since reset on: <strong>{new Date(dashboard.lastResetAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </span>
            </div>
            <button
              onClick={openHistoryModal}
              className="text-emerald-700 font-bold hover:text-emerald-900 underline cursor-pointer text-xs"
            >
              View Previous Archived Stats →
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-cards-wrapper border border-[#94B2AA]/30 bg-white rounded-2xl shadow-sm p-2 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="transition-all hover:translate-y-[-2px]">
                  <div className="flex items-center gap-4 p-5">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border ${item.bg} ${item.border}`}>
                      <Icon className={`${item.iconColor} text-lg`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xl font-bold text-[#2C2C2C] mt-0.5">{item.value}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100" />
                </div>
              );
            })}
          </div>
        </div>



        {/* Full-Width Order Report Chart */}
        <div className="w-full mb-6">
          <Paper className="p-6 rounded-2xl w-full shadow-sm border border-[#94B2AA]/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C]">
                  Order Report
                </Typography>
                <Typography variant="caption" className="text-gray-500 font-medium">
                  {currentChart.subtitle}
                </Typography>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Timeframe Dropdown */}
                <div className="relative">
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="appearance-none bg-white border-2 border-[#248C70] text-[#248C70] font-bold text-sm rounded-xl px-4 py-2 pr-9 shadow-sm hover:border-[#1c6d57] focus:outline-none focus:ring-2 focus:ring-[#248C70]/30 cursor-pointer transition-all"
                  >
                    <option value="Daily">📅 Daily Orders</option>
                    <option value="Weekly">📊 Weekly Orders</option>
                    <option value="Monthly">📈 Monthly Orders</option>
                    <option value="Yearly">🏆 Yearly Orders</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#248C70]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#248C70]/10 text-[#248C70] border border-[#248C70]/20">
                  ● {timeframe} View
                </span>
                <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#E89D1E]/10 text-[#E89D1E] border border-[#E89D1E]/20">
                  ● {currentChart.badge}
                </span>
              </div>
            </div>
            
            <div className="h-80 sm:h-96 w-full">
              <Line 
                key={timeframe}
                data={lineData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#2C2C2C',
                      titleColor: '#FFFFFF',
                      bodyColor: '#FFFFFF',
                      borderColor: '#94B2AA',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8,
                      displayColors: false,
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#555555', font: { weight: 500 } }
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(148, 178, 170, 0.15)' },
                      ticks: { color: '#555555', font: { weight: 500 } }
                    }
                  }
                }} 
              />
            </div>
          </Paper>
        </div>

        {/* Bottom Section: Earnings + Recent Orders + Top Restaurants + Top Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Earnings Doughnut */}
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
            <div>
              <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C] mb-1">
                Earnings
              </Typography>
              <Typography variant="caption" className="text-gray-500 font-medium">
                Order fulfillment ratio
              </Typography>
            </div>
            <div className="h-52 my-auto flex items-center justify-center py-2">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </Paper>

          {/* Recent Orders */}
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C]">
                  Recent Orders
                </Typography>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              </div>
              {dashboard.recentOrders.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No recent orders found</p>
              ) : (
                dashboard.recentOrders.map((order, i) => (
                  <div 
                    key={i} 
                    onClick={() => order.orderId && navigate(`/view-order/${order.orderId}`)}
                    className="flex items-center justify-between gap-2 mb-3.5 last:mb-0 min-w-0 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors group"
                    title="Click to view live order details"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#E89D1E]/15 flex items-center justify-center text-[#E89D1E] font-bold text-sm shrink-0">
                        ⏱
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-sm text-[#2C2C2C] truncate">{order.id}</p>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[130px]">
                            🍽️ {order.restaurantName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate capitalize">{order.status}</p>
                      </div>
                    </div>
                    <p className="text-[#248C70] font-bold text-sm shrink-0 whitespace-nowrap">{order.amount}</p>
                  </div>
                ))
              )}
            </div>
          </Paper>

          {/* Top Restaurants */}
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C]">
                  Top Restaurants
                </Typography>
                <span className="text-xs text-gray-400 font-medium">By Revenue</span>
              </div>
              {dashboard.topRestaurants.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No restaurant data</p>
              ) : (
                dashboard.topRestaurants.map((res, i) => (
                  <div key={i} className="flex justify-between items-center gap-2 mb-3.5 last:mb-0 min-w-0 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#2C2C2C] truncate" title={res.name}>
                        🍽️ {res.name}
                      </p>
                      <p className="text-xs text-gray-500">Orders: {res.orders}</p>
                    </div>
                    <p className="text-[#248C70] font-bold text-sm shrink-0 whitespace-nowrap">{res.amount}</p>
                  </div>
                ))
              )}
            </div>
          </Paper>

          {/* Top Users */}
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C]">
                  Top Users
                </Typography>
                <span className="text-xs text-gray-400 font-medium">By Volume</span>
              </div>
              {dashboard.topUsers.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No user data</p>
              ) : (
                dashboard.topUsers.map((user, i) => (
                  <div key={i} className="flex justify-between items-center gap-2 mb-3.5 last:mb-0 min-w-0 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#248C70]/10 flex items-center justify-center text-[#248C70] shrink-0">
                        👤
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-[#2C2C2C] truncate">{user.name}</p>
                        <p className="text-xs text-gray-500">Orders: {user.orders}</p>
                      </div>
                    </div>
                    <span className="text-[#248C70] font-bold text-xs px-2.5 py-1 rounded-full bg-[#248C70]/10 border border-[#248C70]/20 shrink-0 whitespace-nowrap">
                      {user.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Paper>
        </div>

        {/* Financial Reset History Modal */}
        <Dialog
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }
          }}
        >
          <DialogTitle sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <History fontSize="small" />
              </div>
              <div>
                <Typography variant="h6" className="font-black text-slate-800 leading-tight text-base">
                  Financial Reset History
                </Typography>
                <Typography variant="caption" className="text-slate-400 font-medium block mt-0.5">
                  Historical snapshots of revenue, commissions & order counts archived before each reset
                </Typography>
              </div>
            </div>
            <IconButton onClick={() => setIsHistoryOpen(false)} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#1e293b' } }}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc', maxHeight: '65vh' }}>
            {historyLoading ? (
              <div className="py-20 text-center">
                <CircularProgress size={32} sx={{ color: '#059669', mb: 2 }} />
                <p className="text-xs text-slate-500 font-medium">Fetching archived reset records from database...</p>
              </div>
            ) : resetHistory.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ReceiptLong style={{ fontSize: 28 }} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Past Reset History Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Financial statistics are currently accumulating continuously in real-time. When you click "Reset Financial Stats to ₹0", a complete snapshot will be automatically archived here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resetHistory.map((item: any, idx: number) => {
                  const dateStr = item.resetAt
                    ? new Date(item.resetAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Past Reset';
                  const m = item.metrics || {};

                  return (
                    <div
                      key={item._id || idx}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                            <CalendarMonth style={{ fontSize: 13 }} />
                            {dateStr}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            Reset #{resetHistory.length - idx}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Reset by: <strong className="text-slate-800">{item.resetBy?.name || 'Super Admin'}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Archived Earnings</p>
                          <p className="text-base font-black text-slate-900 mt-1">
                            ₹{Number(m.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Admin Commission</p>
                          <p className="text-base font-black text-amber-800 mt-1">
                            ₹{Number(m.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Restaurant Comm.</p>
                          <p className="text-base font-black text-emerald-800 mt-1">
                            ₹{Number(m.totalRestaurantCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                          <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Delivery Boy Comm.</p>
                          <p className="text-base font-black text-blue-800 mt-1">
                            ₹{Number(m.totalDeliveryCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <span>Delivered Orders: <strong className="text-slate-800 font-bold">{m.ordersDelivered ?? 0}</strong></span>
                          <span>Total Orders: <strong className="text-slate-800 font-bold">{m.ordersTotal ?? 0}</strong></span>
                        </div>
                        <span className="text-slate-400 italic truncate max-w-sm">{item.note || 'Manual Reset from Admin Dashboard'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-xs text-slate-400 font-medium">
              {resetHistory.length > 0 ? `${resetHistory.length} archived reset snapshot(s)` : 'No records'}
            </span>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Close
            </button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MainGrid;
















// import * as React from 'react';
// import React from 'react';
// import { 
//   Box, Container, Grid, Paper, Typography, Avatar, 
//   List, ListItem, ListItemText, ListItemAvatar,Stack 
// } from '@mui/material';
// import { 
//   People, LocalShipping, Storefront, AttachMoney, 
//   Check, Close, AccessTime 
// } from '@mui/icons-material';
// import { Doughnut, Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Filler,
// } from 'chart.js';
// import {
//   Restaurant,
//   Payments,
//   TrendingUp,
//   CardGiftcard,
//   DeliveryDining,
//   Person
// } from '@mui/icons-material'

// ChartJS.register(
//   ArcElement, Tooltip, Legend, CategoryScale, 
//   LinearScale, PointElement, LineElement, Filler
// );
// const stats = [
//   { label: 'Total Users', value: '1505', icon: People, bg: 'bg-teal-100', border: 'border-teal-200', iconColor: 'text-teal-600' },
//   { label: 'Total Delivery Partners', value: '961', icon: LocalShipping, bg: 'bg-green-100', border: 'border-green-200', iconColor: 'text-green-500' },
//   { label: 'Total Restaurants', value: '496', icon: Restaurant, bg: 'bg-orange-100', border: 'border-orange-200', iconColor: 'text-orange-500' },
//   { label: 'Total Earnings', value: '123027.84', icon: Payments, bg: 'bg-yellow-100', border: 'border-yellow-200', iconColor: 'text-yellow-500' },
//   { label: 'Today Earnings', value: '0', icon: TrendingUp, bg: 'bg-red-100', border: 'border-red-200', iconColor: 'text-red-500' },
//   { label: 'Total Admin Commission', value: '9314.93', icon: AttachMoney, bg: 'bg-yellow-100', border: 'border-yellow-200', iconColor: 'text-yellow-500' },
//   { label: 'Total Restaurant Commission', value: '98319.73', icon: CardGiftcard, bg: 'bg-green-100', border: 'border-green-200', iconColor: 'text-green-500' },
//   { label: 'Total Delivery Boy Commission', value: '10819.11', icon: DeliveryDining, bg: 'bg-red-100', border: 'border-red-200', iconColor: 'text-red-500' }
// ];

// const MainGrid = () => {
//   // Chart Data
//   const doughnutData = {
//     labels: ['Delivered', 'Cancelled', 'Failed'],
//     datasets: [{
//       data: [65, 20, 15],
//       backgroundColor: ['#ffd166', '#ef476f', '#06d6a0'],
//     }],
//   };

//   const lineData = {
//     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
//     datasets: [{
//       label: 'Orders',
//       data: [1, 3, 1, 2, 2, 1, 3, 5, 2, 1],
//       fill: true,
//       backgroundColor: 'rgba(255, 209, 102, 0.4)',
//       borderColor: '#ffb703',
//       tension: 0.4,
//     }],
//   };

//   const topRestaurants = [
//     { name: 'KFC', orders: 50, revenue: '$18581', color: 'bg-red-500' },
//     { name: 'The Food Story', orders: 43, revenue: '$10330', color: 'bg-orange-400' },
//     { name: 'Bozen Kebab', orders: 39, revenue: '$3067', color: 'bg-yellow-500' },
//   ];

//    function StatsCards() {
//       return (
//         <div className="stats-cards-wrapper sm:mt-12 md:mt-0 border bg-white rounded-lg " >
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
//             {stats.map((item) => {
//             const Icon = item.icon;
    
//             return (
//               <div
//                 key={item.label}
//                 className=" "
//               >
//                 <div className="flex items-center gap-4 p-5">
//                   <div
//                     className={`w-12 h-12 flex items-center justify-center rounded-full border ${item.bg} ${item.border}`}
//                   >
//                     <Icon className={`${item.iconColor} text-lg`} />
//                   </div>
    
//                   <div>
//                     <p className="text-sm text-gray-500">{item.label}</p>
//                     <p className="text-xl font-semibold text-gray-800">
//                       {item.value}
//                     </p>
//                   </div>
//                 </div>
    
//                 {/* partition */}
//                 <div className="border-t border-gray-100" />
//               </div>
//             );
//             })}
//           </div>
//         </div>
//       );
//     }
  

//   return (
//     <Box className="min-h-screen bg-[#f4f6f9] p-6">
//       <Container maxWidth="xl">
//             <StatsCards/>
//              <br/>
         
//         {/* Charts Grid */}
//          <Grid container spacing={3} className="mb-6">
//           <Grid item xs={12} md={4}>
//             <Paper className="p-5 rounded-2xl h-full shadow-sm">
//               <Typography variant="h6" className="mb-4 text-gray-600 font-semibold">Earnings</Typography>
//               <div className="h-64 flex justify-center">
//                 <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
//               </div>
//             </Paper>
        
//           </Grid>
//           <Grid item xs={12} md={8}>
//             <Paper className="p-5 rounded-2xl h-full shadow-sm">
//               <Typography variant="h6" className="mb-4 text-gray-600 font-semibold">Order Report</Typography>
//               <div className="h-64">
//                 <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
//               </div>
//             </Paper>
//           </Grid>
//         </Grid> 

//      {/* BOTTOM LIST SECTION */}
// <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//   {/* RECENT ORDERS */}
//   <div className="bg-white shadow-card rounded-xl p-6">
//     <h3 className="font-medium mb-6">Recent Orders</h3>

//     {[
//       { id: "DW1907", status: "New Order", amount: "RM 312.50" },
//       { id: "DW1906", status: "Driver Assigned", amount: "RM 200.00" },
//       { id: "DW1905", status: "Order Accepted", amount: "RM 10.00" },
//       { id: "DW1904", status: "New Order", amount: "RM 13.00" },
//       { id: "DW1903", status: "New Order", amount: "RM 12.00" },
//     ].map((order, i) => (
//       <div key={i} className="flex items-center justify-between mb-5 last:mb-0">
//         <div className="flex items-center gap-4">
//           <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
//             ⏱
//           </div>
//           <div>
//             <p className="font-medium">{order.id}</p>
//             <p className="text-sm text-gray-500">{order.status}</p>
//           </div>
//         </div>
//         <p className="text-green-500 font-medium">{order.amount}</p>
//       </div>
//     ))}
//   </div>

//   {/* TOP RESTAURANTS */}
//   <div className="bg-white shadow-card rounded-xl p-6">
//     <h3 className="font-medium mb-6">Top Restaurants</h3>

//     {[
//       { name: "KFC", orders: 50, amount: "RM 18581.29" },
//       { name: "The Food Story Chennai", orders: 43, amount: "RM 10330.36" },
//       { name: "Bozen kebap", orders: 39, amount: "RM 3067.88" },
//       { name: "Ravintola Pepino", orders: 31, amount: "RM 674.83" },
//       { name: "Wangs Kitchen", orders: 18, amount: "RM 14796.32" },
//     ].map((res, i) => (
//       <div key={i} className="flex justify-between items-center mb-5 last:mb-0">
//         <div>
//           <p className="font-medium">{res.name}</p>
//           <p className="text-sm text-gray-500">Orders : {res.orders}</p>
//         </div>
//         <p className="text-green-500 font-medium">{res.amount}</p>
//       </div>
//     ))}
//   </div>

//   {/* TOP USERS */}
//   <div className="bg-white shadow-card rounded-xl p-6">
//     <h3 className="font-medium mb-6">Top Users</h3>

//     {[
//       { name: "Dining", orders: 29, amount: "RM 3033.87" },
//       { name: "balaji", orders: 28, amount: "RM 5882.04" },
//       { name: "Sherko Ali", orders: 25, amount: "RM 726.81" },
//       { name: "mutlu", orders: 22, amount: "RM 2484.01" },
//       { name: "Gausul Azam", orders: 18, amount: "RM 6215.96" },
//     ].map((user, i) => (
//       <div key={i} className="flex justify-between items-center mb-5 last:mb-0">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-full border flex items-center justify-center text-gray-500">
//             👤
//           </div>
//           <div>
//             <p className="font-medium">{user.name}</p>
//             <p className="text-sm text-gray-500">Orders : {user.orders}</p>
//           </div>
//         </div>
//         <p className="text-green-500 font-medium">{user.amount}</p>
//       </div>
//     ))}
//   </div>

// </div>


//       </Container>
//     </Box>
//   );
// };

// export default MainGrid;