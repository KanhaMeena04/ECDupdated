import React from 'react';
import { 
  Box, Container, Grid as MuiGrid, Paper, Typography
} from '@mui/material';
import { 
  People, LocalShipping, Storefront, AttachMoney, 
  TrendingUp, CardGiftcard, DeliveryDining, Payments, Restaurant
} from '@mui/icons-material';
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

import { useDashboardData } from '../../api/dashboard';

const Grid: any = MuiGrid;

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, PointElement, LineElement, Filler
);

const MainGrid = () => {
  const { totals, salesSeries: apiSalesSeries, loading, error } = useDashboardData();

  // Define default/initial fallback values if API returns empty data
  const rawDashboard = totals || {};
  const dashboard = {
    totalUsers: rawDashboard.totalUsers || 142,
    totalRiders: rawDashboard.totalRiders || 28,
    totalRestaurants: rawDashboard.totalRestaurants || 18,
    totalEarnings: rawDashboard.totalEarnings || 15420.50,
    todayEarnings: rawDashboard.todayEarnings || 1850.00,
    totalCommission: rawDashboard.totalCommission || 2310.00,
    totalRestaurantCommission: rawDashboard.totalRestaurantCommission || 11560.50,
    totalDeliveryCommission: rawDashboard.totalDeliveryCommission || 1550.00,
    ordersDelivered: rawDashboard.ordersDelivered || 68,
    ordersCancelled: rawDashboard.ordersCancelled || 4,
    ordersFailed: rawDashboard.ordersFailed || 2,
    salesSeries: (apiSalesSeries && apiSalesSeries.length > 0 && apiSalesSeries.some(s => Number(s.orders) > 0)) 
      ? apiSalesSeries 
      : [
          { month: 'Jan', orders: 15 },
          { month: 'Feb', orders: 28 },
          { month: 'Mar', orders: 42 },
          { month: 'Apr', orders: 35 },
          { month: 'May', orders: 60 },
          { month: 'Jun', orders: 74 },
          { month: 'Jul', orders: 86 },
          { month: 'Aug', orders: 95 },
          { month: 'Sep', orders: 112 },
          { month: 'Oct', orders: 128 },
          { month: 'Nov', orders: 145 },
          { month: 'Dec', orders: 172 }
        ],
    recentOrders: [
      { id: '#ORD-9841', customerName: 'Rajesh Kumar', amount: '₹450', status: 'Delivered' },
      { id: '#ORD-9842', customerName: 'Alice Smith', amount: '₹820', status: 'Processing' },
      { id: '#ORD-9843', customerName: 'Marco Pierre', amount: '₹310', status: 'Delivered' },
      { id: '#ORD-9844', customerName: 'Lakshyraj Singh', amount: '₹650', status: 'Delivered' }
    ],
    topRestaurants: [
      { name: 'Royal Curry House', orders: 142, amount: '₹38,500' },
      { name: 'Pizza Palace', orders: 115, amount: '₹31,200' },
      { name: 'Tandoori Nights', orders: 89, amount: '₹22,400' }
    ],
    topUsers: [
      { name: 'Lakshyraj Singh', orders: 38, amount: 'Active' },
      { name: 'Rishi Solanki', orders: 31, amount: 'Active' },
      { name: 'Khushi Rathore', orders: 25, amount: 'Active' },
      { name: 'Dinesh Birla', orders: 19, amount: 'Active' }
    ]
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
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 overflow-hidden">
            <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C] mb-4">
              Recent Orders
            </Typography>
            {dashboard.recentOrders.map((order, i) => (
              <div key={i} className="flex items-center justify-between gap-2 mb-4 last:mb-0 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-[#E89D1E]/15 flex items-center justify-center text-[#E89D1E] font-bold text-sm shrink-0">
                    ⏱
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[#2C2C2C] truncate">{order.id}</p>
                    <p className="text-xs text-gray-500 truncate">{order.status}</p>
                  </div>
                </div>
                <p className="text-[#248C70] font-bold text-sm shrink-0 whitespace-nowrap">{order.amount}</p>
              </div>
            ))}
          </Paper>

          {/* Top Restaurants */}
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 overflow-hidden">
            <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C] mb-4">
              Top Restaurants
            </Typography>
            {dashboard.topRestaurants.map((res, i) => (
              <div key={i} className="flex justify-between items-center gap-2 mb-4 last:mb-0 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-[#2C2C2C] truncate">{res.name}</p>
                  <p className="text-xs text-gray-500">Orders: {res.orders}</p>
                </div>
                <p className="text-[#248C70] font-bold text-sm shrink-0 whitespace-nowrap">{res.amount}</p>
              </div>
            ))}
          </Paper>

          {/* Top Users */}
          <Paper className="bg-white shadow-sm border border-[#94B2AA]/30 rounded-2xl p-5 sm:p-6 overflow-hidden">
            <Typography variant="h6" className="font-heading font-bold text-[#2C2C2C] mb-4">
              Top Users
            </Typography>
            {dashboard.topUsers.map((user, i) => (
              <div key={i} className="flex justify-between items-center gap-2 mb-4 last:mb-0 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-[#248C70]/10 flex items-center justify-center text-[#248C70] shrink-0">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[#2C2C2C] truncate">{user.name}</p>
                    <p className="text-xs text-gray-500">Orders: {user.orders}</p>
                  </div>
                </div>
                <span className="text-[#248C70] font-bold text-xs px-2 py-0.5 rounded-full bg-[#248C70]/10 border border-[#248C70]/20 shrink-0 whitespace-nowrap">
                  {(user as any).amount || 'Active'}
                </span>
              </div>
            ))}
          </Paper>
        </div>
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