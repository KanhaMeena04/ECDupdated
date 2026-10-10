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
import SupportAgent from "@mui/icons-material/SupportAgent";

import { useAuth } from '../context/AuthContext';

export interface MenuItemType {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: string;
  badge?: string;
  children?: { text: string; path: string; permission?: string }[];
}

export const menuItems: MenuItemType[] = [
  { text: 'Dashboard', icon: <HomeRounded />, path: '/dashboard', permission: 'Dashboard' },
  { text: 'Live Orders', icon: <Assignment />, path: '/order-dashboard', permission: 'Order' },
  { text: 'Live Map', icon: <Map />, path: '/eagles-view', permission: 'Order' },
  { text: 'Customers', icon: <People />, path: '/user-management', permission: 'User' },

  {
    text: 'Restaurants',
    icon: <Store />,
    permission: 'Restaurant',
    children: [
      { text: 'All Restaurants', path: '/restaurants' },
      { text: 'Pending Approval', path: '/pending-restaurants' },
      { text: 'Approved Restaurants', path: '/approve-restaurant' },
      { text: 'Restaurant Promocodes', path: '/promocodes', permission: 'Promocode' },
      { text: 'Add Promocode', path: '/add-promocodes', permission: 'Promocode' },
    ]
  },

  {
    text: 'Riders',
    icon: <DriveEta />,
    permission: 'Driver',
    children: [
      { text: 'All Riders', path: '/driver-list' },
      { text: 'Pending Verification', path: '/pending-driver-list' },
      { text: 'Earnings & Config', path: '/rider-earnings-control' },
      { text: 'Payout Requests', path: '/rider-payout-requests', permission: 'Settlements' },
      { text: 'Cash Management', path: '/rider-cash-management' },
    ]
  },

  { text: 'Orders', icon: <Assignment />, path: '/new-order', permission: 'Order' },

  {
    text: 'Menu',
    icon: <RestaurantMenu />,
    permission: 'Restaurant',
    children: [
      { text: 'Menu Items', path: '/catalog-master-control' },
      { text: 'Categories', path: '/category', permission: 'Category' },
      { text: 'Subcategories', path: '/category?tab=1', permission: 'Category' },
      { text: 'Pending Menu Approvals', path: '/pending-menu-approvals', permission: 'MenuApprovals' },
      { text: 'Category Requests', path: '/category-requests', permission: 'Category' },
      { text: 'Menu Approval History', path: '/menu-approval-history', permission: 'MenuApprovals' },
    ]
  },

  {
    text: 'Pricing',
    icon: <AttachMoney />,
    permission: 'SiteSettings',
    children: [
      { text: 'Delivery Charges', path: '/pricing-control' },
      { text: 'Commission', path: '/financial-overview', permission: 'Reports' },
      { text: 'Packaging', path: '/pricing-control' },
      { text: 'Platform Fees', path: '/pricing-control' },
    ]
  },

  {
    text: 'Marketing',
    icon: <Campaign />,
    permission: 'Promocode',
    children: [
      { text: 'Coupons & Offers', path: '/promocodes', permission: 'Promocode' },
      { text: 'Banners', path: '/restaurant-banner', permission: 'CMSControlTower' },
      { text: 'Notifications', path: '/custom-push', permission: 'PushNotifications' },
    ]
  },

  {
    text: 'Finance',
    icon: <AccountBalance />,
    permission: 'Reports',
    children: [
      { text: 'Payments', path: '/financial-overview', permission: 'Reports' },
      { text: 'Refunds', path: '/order-refund', permission: 'Reports' },
      { text: 'Restaurant Settlement', path: '/restaurant-payout', permission: 'Settlements' },
      { text: 'Rider Settlement', path: '/driver-payout', permission: 'Settlements' },
      { text: 'Reconciliation', path: '/payment-reconciliation', permission: 'Reports' },
    ]
  },

  { text: 'Service Areas', icon: <LocationCity />, path: '/service-areas', permission: 'City' },
  { text: 'Self Pickup', icon: <Storefront />, path: '/self-pickup-control', permission: 'SiteSettings' },
  { text: 'Order Timings & Cancellation', icon: <Schedule />, path: '/order-timing-control', permission: 'SiteSettings' },
  { text: 'CMS', icon: <Article />, path: '/user-app-cms', permission: 'CMSControlTower' },
  { text: 'Reports & Analytics', icon: <BarChart />, path: '/profit-loss-report', permission: 'Reports' },

  { text: 'Feature Flags', icon: <Flag />, path: '/feature-flags', permission: 'RuleEngine' },

  {
    text: 'Master Settings',
    icon: <SettingsApplications />,
    permission: 'SiteSettings',
    children: [
      { text: 'Order & Cancellation Rules', path: '/order-timing-control' },
      { text: 'Delivery Rules', path: '/pricing-control' },
      { text: 'Rider Rules', path: '/rider-earnings-control' },
      { text: 'Restaurant Rules', path: '/self-pickup-control' },
      { text: 'Refund Rules', path: '/payment-reconciliation' },
    ]
  },

  { text: 'Roles & Permissions', icon: <Security />, path: '/role', permission: 'RuleEngine' },
  { text: 'Audit Logs', icon: <ReceiptLong />, path: '/audit-logs', permission: 'SiteSettings' },
  { text: 'Chat Support', icon: <SupportAgent sx={{ color: '#248C70' }} />, path: '/support-chat', badge: 'LIVE' },
  { text: 'Emergency Controls', icon: <Warning />, path: '/emergency-controls', permission: 'RuleEngine' },
  { text: 'System Health', icon: <HealthAndSafety />, path: '/dashboard', permission: 'Dashboard' },
];

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState<string | null>(null);
  const { user } = useAuth();

  const userPerms: string[] | undefined = (user as any)?.permissions;
  const isSuperAdmin = !userPerms ||
    userPerms.length === 0 ||
    userPerms.includes('all') ||
    user?.role === 'admin' ||
    (user as any)?.role === 'admin' ||
    user?.email === 'admin@gmail.com' ||
    user?.email === 'admin@ecdkart.com' ||
    (user as any)?.roleName === 'Super Admin' ||
    (user as any)?.name === 'Super Admin';

  const visibleMenuItems = React.useMemo(() => {
    if (isSuperAdmin || !Array.isArray(userPerms)) {
      return menuItems;
    }
    return menuItems.filter(item => {
      if (!item.permission) return true;
      if (userPerms.includes(item.permission)) return true;
      if (item.children && item.children.length > 0) {
        return item.children.some(child => {
          const perm = child.permission || item.permission;
          return !perm || userPerms.includes(perm);
        });
      }
      return false;
    }).map(item => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter(child => {
        const perm = child.permission || item.permission;
        return !perm || userPerms.includes(perm);
      });
      return { ...item, children: filteredChildren };
    });
  }, [userPerms, isSuperAdmin]);

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
        {visibleMenuItems.map((item) => (
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
                {item.badge && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    letterSpacing: '0.5px',
                    marginRight: '4px'
                  }}>
                    {item.badge}
                  </span>
                )}
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