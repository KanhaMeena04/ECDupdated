import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Collapse,
  Box,
} from '@mui/material'
import {
  HomeRounded,
  Assignment,
  Store,
  LocationCity,
  DriveEta,
  Cancel,
  Percent,
  Image,
  People,
  ChevronRight,
  RadioButtonUnchecked,
  SettingsApplications,
  Category,
  Map,
  LocalShipping,
  RestaurantMenu,
  AttachMoney,
  Campaign,
  AccountBalance,
  Storefront,
  Tune,
  Flag,
  Schedule,
  Warning,
  ReceiptLong,
  HealthAndSafety,
} from '@mui/icons-material'
import AccountBalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import RateReview from "@mui/icons-material/RateReview";
import Article from "@mui/icons-material/Article";
import Security from "@mui/icons-material/Security";
import BarChart from "@mui/icons-material/BarChart";

export const menuItems = [
  { text: 'Dashboard', icon: <HomeRounded />, path: '/dashboard' },
  { text: 'Live Orders', icon: <Assignment />, path: '/order-dashboard' },
  { text: 'Live Map', icon: <Map />, path: '/eagles-view' },
  { text: 'Customers', icon: <People />, path: '/user-management' },

  {
    text: 'Restaurants',
    icon: <Store />,
    children: [
      { text: 'All Restaurants', path: '/restaurants' },
      { text: 'Pending Approval', path: '/pending-restaurants' },
      { text: 'Menu Approval', path: '/approve-restaurant' },
      { text: 'Documents', path: '/documents' },
      { text: 'Restaurant Controls', path: '/active-restaurants' },
    ]
  },

  {
    text: 'Riders',
    icon: <DriveEta />,
    children: [
      { text: 'All Riders', path: '/driver-list' },
      { text: 'Pending Verification', path: '/pending-driver-list' },
      { text: 'Payout Requests', path: '/rider-payout-requests' },
      { text: 'Earnings', path: '/rider-earnings-control' },
      { text: 'Incentives', path: '/promocodes' },
    ]
  },

  { text: 'Orders', icon: <Assignment />, path: '/new-order' },
  { text: 'Dispatch', icon: <LocalShipping />, path: '/driver-live-location/live' },

  {
    text: 'Menu',
    icon: <RestaurantMenu />,
    children: [
      { text: 'Menu Items', path: '/catalog-master-control' },
      { text: 'Categories', path: '/category' },
      { text: 'Subcategories', path: '/filter-category' },
      { text: 'Pending Menu Approvals', path: '/pending-menu-approvals' },
      { text: 'Category Requests', path: '/category-requests' },
      { text: 'Menu Approval History', path: '/menu-approval-history' },
    ]
  },

  {
    text: 'Pricing',
    icon: <AttachMoney />,
    children: [
      { text: 'Delivery Charges', path: '/pricing-control' },
      { text: 'Commission', path: '/financial-overview' },
      { text: 'Packaging', path: '/pricing-control' },
      { text: 'Platform Fees', path: '/pricing-control' },
    ]
  },

  {
    text: 'Marketing',
    icon: <Campaign />,
    children: [
      { text: 'Coupons', path: '/promocodes' },
      { text: 'Offers', path: '/add-promocodes' },
      { text: 'Banners', path: '/restaurant-banner' },
      { text: 'Notifications', path: '/custom-push' },
    ]
  },

  {
    text: 'Finance',
    icon: <AccountBalance />,
    children: [
      { text: 'Payments', path: '/financial-overview' },
      { text: 'Refunds', path: '/order-refund' },
      { text: 'Restaurant Settlement', path: '/restaurant-payout' },
      { text: 'Rider Settlement', path: '/driver-payout' },
      { text: 'Rider Payout Requests', path: '/rider-payout-requests' },
      { text: 'Reconciliation', path: '/payment-reconciliation' },
    ]
  },

  { text: 'Service Areas', icon: <LocationCity />, path: '/service-areas' },
  { text: 'Self Pickup', icon: <Storefront />, path: '/self-pickup-control' },
  { text: 'CMS', icon: <Article />, path: '/user-app-cms' },
  { text: 'Analytics', icon: <BarChart />, path: '/profit-loss-report' },
  { text: 'Reports', icon: <BarChart />, path: '/order-report' },

  { text: 'Rule Engine', icon: <Tune />, path: '/rule-engine' },
  { text: 'Feature Flags', icon: <Flag />, path: '/feature-flags' },
  { text: 'Scheduled Changes', icon: <Schedule />, path: '/scheduled-changes' },

  {
    text: 'Master Settings',
    icon: <SettingsApplications />,
    children: [
      { text: 'Order Rules', path: '/setting' },
      { text: 'Delivery Rules', path: '/pricing-control' },
      { text: 'Rider Rules', path: '/setting' },
      { text: 'Restaurant Rules', path: '/setting' },
      { text: 'Cancellation Rules', path: '/cancellation-reason' },
      { text: 'Refund Rules', path: '/setting' },
    ]
  },

  { text: 'Roles & Permissions', icon: <Security />, path: '/role' },
  { text: 'Audit Logs', icon: <ReceiptLong />, path: '/audit-logs' },
  { text: 'Emergency Controls', icon: <Warning />, path: '/emergency-controls' },
  { text: 'System Health', icon: <HealthAndSafety />, path: '/dashboard' },
]

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <Stack
      sx={{
        width: '100%',
        position: 'relative',
        top: 0,
        left: 0,
        height: 'auto',
        bgcolor: 'background.paper',
        boxShadow: 'none',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() =>
                  item.children
                    ? setOpen(open === item.text ? null : item.text)
                    : navigate(item.path!)
                }
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  mx: 1,
                  backgroundColor: location.pathname === item.path ? 'rgba(36, 140, 112, 0.12)' : 'transparent',
                  color: location.pathname === item.path ? '#248C70' : '#2C2C2C',
                  '&:hover': { bgcolor: 'rgba(36, 140, 112, 0.08)' }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36, 
                  color: location.pathname === item.path ? '#248C70' : '#2C2C2C' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: location.pathname === item.path ? 600 : 500 }} />
                {item.children && (
                  <Box
                    sx={{
                      ml: 'auto',
                      transform: open === item.text ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: '0.2s',
                      display: 'flex',
                      color: open === item.text ? '#248C70' : '#2C2C2C'
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </Box>
                )}
              </ListItemButton>
            </ListItem>

            {item.children && (
              <Collapse in={open === item.text} timeout="auto" unmountOnExit>
                <List sx={{ pl: 4, mt: 0.5 }}>
                  {item.children.map((sub) => (
                    <ListItem key={sub.text} disablePadding sx={{ mb: 0.3 }}>
                      <ListItemButton
                        onClick={() => navigate(sub.path)}
                        sx={{
                          px: 2,
                          py: 0.7,
                          borderRadius: 1,
                          mr: 1,
                          backgroundColor: location.pathname === sub.path ? 'rgba(232, 157, 30, 0.15)' : 'transparent',
                          color: location.pathname === sub.path ? '#E89D1E' : '#2C2C2C',
                          '&:hover': {
                            backgroundColor: '#248C70',
                            color: '#fff',
                            '& .MuiListItemIcon-root': { color: '#fff' }
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: location.pathname === sub.path ? '#E89D1E' : '#94B2AA' }}>
                          <RadioButtonUnchecked sx={{ fontSize: 10 }} />
                        </ListItemIcon>
                        <ListItemText primary={sub.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: location.pathname === sub.path ? 600 : 400 }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Stack>
  );
}