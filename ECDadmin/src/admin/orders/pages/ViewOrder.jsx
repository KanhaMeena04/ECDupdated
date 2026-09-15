
import { 
  Typography, Button, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Divider, Chip 
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAdminOrderDetails } from '../../api/order'; // custom hook
import PageHeader from '../../components/PageHeader';
import { getName, getAddress } from '../../../utils/orderData';

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const ViewOrder = () => {
  const { id } = useParams();
  const { order, loading, error } = useAdminOrderDetails(id);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
      <Typography sx={{ color: BRAND_MAIN, fontWeight: 'bold' }}>Loading order details...</Typography>
    </Box>
  );
  
  if (error) return <div className="text-center p-8 text-red-500 font-bold">Error: {error}</div>;
  if (!order) return <div className="text-center p-8">No order found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-700">
      <PageHeader
        title="View Order"
        breadcrumbs={[
          { label: 'Order Management', href: '/orders' },
          { label: 'View Order', active: true },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Main Content */}
        <Paper className="flex-1 p-8 shadow-sm border border-gray-100" sx={{ borderRadius: 3 }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              {/* Updated Restaurant Name to Brand Color */}
              <h2 className="text-3xl font-black" style={{ color: BRAND_MAIN }}>
                {order.restaurant?.name ? getName(order.restaurant.name) : 'Restaurant'}
              </h2>
              <div className="mt-4 space-y-1 text-sm text-gray-500">
                <p>Order Status : <span className="font-bold text-gray-800 uppercase px-2 py-0.5 rounded" style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_MAIN }}>{order.status}</span></p>
                <p>Ordered On : {new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-400">
                Order ID <span className="text-gray-800 font-bold">#{order._id}</span>
              </p>
              <Chip
                label={order.orderType === 'self_pickup' ? 'Self Pickup 🛍️' : 'Delivery 🚴'}
                color={order.orderType === 'self_pickup' ? 'secondary' : 'primary'}
                size="small"
                sx={{ mt: 1, fontWeight: 'bold' }}
              />
            </div>
          </div>

          <hr className="my-8 border-gray-100" />

          {/* Customer & Restaurant Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="font-bold uppercase text-xs tracking-wider mb-4" style={{ color: BRAND_MAIN }}>Customer Details :</h3>
              <div className="text-sm space-y-1 leading-relaxed">
                <p className="font-bold text-gray-900 text-base">{order.customer?.name }</p>
                <p className="text-gray-500">{order.customer?.address ? getAddress(order.customer.address) : ''}</p>
                <p className="text-gray-500 font-medium">{order.customer?.mobile}</p>
                <p className="text-gray-500">{order.customer?.email}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold uppercase text-xs tracking-wider mb-4" style={{ color: BRAND_MAIN }}>Restaurant Details :</h3>
              <div className="text-sm space-y-1 leading-relaxed">
                <p className="font-bold text-gray-900 text-base">{order.restaurant?.name ? getName(order.restaurant.name) : ''}</p>
                <p className="text-gray-500">{order.restaurant?.address ? getAddress(order.restaurant.address) : ''}</p>
                <p className="text-gray-500 font-medium">{order.restaurant?.phone}</p>
                <p className="text-gray-500">{order.restaurant?.email}</p>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <TableContainer component="div" className="border border-gray-100 rounded-xl overflow-hidden">
            <Table>
              <TableHead style={{ backgroundColor: BRAND_BG_LIGHT }}>
                <TableRow>
                  <TableCell className="font-bold uppercase text-xs" style={{ color: BRAND_MAIN }}>Image</TableCell>
                  <TableCell className="font-bold uppercase text-xs" style={{ color: BRAND_MAIN }}>Name</TableCell>
                  <TableCell className="font-bold uppercase text-xs" style={{ color: BRAND_MAIN }}>Size</TableCell>
                  <TableCell className="font-bold uppercase text-xs" align="center" style={{ color: BRAND_MAIN }}>Qty</TableCell>
                  <TableCell className="font-bold uppercase text-xs" align="right" style={{ color: BRAND_MAIN }}>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#333' }}>
                        {item.name ? (typeof item.name === 'string' ? item.name : getName(item.name)) : ''}
                      </Typography>
                    </TableCell>
                    <TableCell className="text-gray-500 font-medium">{item?.size || '—'}</TableCell>
                    <TableCell align="center" className="font-bold text-gray-700">{item.quantity || 1}</TableCell>
                    <TableCell align="right" className="font-bold text-gray-900">RM {item.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Calculation Area */}
          <div className="mt-8 flex justify-end">
            <Paper elevation={0} sx={{ bgcolor: BRAND_BG_LIGHT, p: 3, borderRadius: 3, width: { xs: '100%', md: 320 } }}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Total</span>
                  <span className="font-bold">RM {order?.itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Packing Charge</span>
                  <span className="font-bold">RM {order?.packing?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-bold">RM {order?.deliveryFee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span className="font-bold">- RM {order?.discount?.toFixed(2)}</span>
                </div>
                <Divider sx={{ my: 1 }} />
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-800">Grand Total</span>
                  <span className="font-black" style={{ color: BRAND_MAIN }}>RM {order?.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </Paper>
          </div>
        </Paper>

        {/* Sidebar Actions */}
        <div className="w-full lg:w-72 space-y-4">
          <Paper className="p-4 shadow-sm" sx={{ borderRadius: 3 }}>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ 
                bgcolor: BRAND_MAIN, 
                '&:hover': { bgcolor: '#c41a1f' },
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Revise Order
            </Button>
          </Paper>
          
          <Paper className="p-4 shadow-sm space-y-3" sx={{ borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 1 }}>PRINT INVOICE</Typography>
            <Button 
              fullWidth 
              variant="outlined" 
              sx={{ 
                borderColor: BRAND_MAIN, 
                color: BRAND_MAIN,
                '&:hover': { borderColor: '#c41a1f', bgcolor: BRAND_BG_LIGHT },
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              A7 Thermal Print
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              sx={{ 
                borderColor: BRAND_MAIN, 
                color: BRAND_MAIN,
                '&:hover': { borderColor: '#c41a1f', bgcolor: BRAND_BG_LIGHT },
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              A4 Document Print
            </Button>
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;