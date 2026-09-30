// import * as React from 'react';
// import Box from '@mui/material/Box';
// import Stack from '@mui/material/Stack';
// import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
// import NavbarBreadcrumbs from './NavbarBreadcrumbs';
// import MenuButton from './MenuButton';
// import ColorModeIconDropdown from '../dashboard/shared-theme/ColorModeIconDropdown';
// import Search from './Search';

// interface HeaderProps {
//   onToggleDashboard?: () => void;
//   showToggleButton?: boolean;
// }

// export default function Header({ onToggleDashboard, showToggleButton }: HeaderProps) {
//   return (
//     <Stack spacing={2} sx={{ m: 0, mt: 0, ml: 0, mr: 0 }}>
      
//       {/* Toggle Button */}
//       {showToggleButton && onToggleDashboard && (
//         <Box sx={{ textAlign: 'left', }}>
//           <button
//             onClick={onToggleDashboard}
//             style={{
//               padding: '10px 20px',
//               backgroundColor:"black",
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: 'pointer',
//               fontSize: '14px',
//               fontWeight: '500'
//             }}
//           >
//             🔄 Switch to Normal Dashboard
//           </button>
//         </Box>
//       )}
       
//       {/* Main Header Content */}
//       <Stack
//         direction="row"
//         sx={{
//           display: { xs: 'none', md: 'flex' },
//           width: '100%',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           maxWidth: '100%',
//           m: 0,
//           mt: 0,
//           mx: 0,
//           py: { xs: 0.5, md: 1.5 },
//           minHeight: { md: 64 },
//           borderBottom: {  md: '2px solid' },
//           borderColor: { md: 'divider' },
//         }}
//         spacing={2}
//       >
//         <Box sx={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
//           <NavbarBreadcrumbs />
//         </Box>

//         <Stack direction="row" sx={{ gap: 1, minWidth: 0, alignItems: 'center' }}>
//           <Box sx={{ minWidth: 0, flex: { xs: '1 1 100%', }, }}>
//             <Search />
//             <ColorModeIconDropdown />

//           </Box>
//           <MenuButton showBadge aria-label="Open notifications">
//             <span></span>
//             <NotificationsRoundedIcon />

//           </MenuButton>
//         </Stack>
//       </Stack>
//     </Stack>
//   );
// }

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Stack, Typography, Badge, Avatar, IconButton, 
  InputBase, Paper, List, ListItem, ListItemText, ClickAwayListener, ListItemIcon, Menu, MenuItem 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; 
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/utils';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import { menuItems } from './MenuContent'; 

const ListItemAny: any = ListItem; 

interface NotificationItem {
  id: string;
  orderId: string;
  orderCode: string;
  restaurantName: string;
  customerName?: string;
  title: string;
  description: string;
  status: string;
  orderType: string;
  amount: number;
  amountFormatted: string;
  createdAt: string;
  read: boolean;
}

const safeText = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.en || val.hi || val.name || val.title || (Object.values(val).find(v => typeof v === 'string') || fallback);
  }
  return String(val);
};

interface HeaderProps {
  onToggleDashboard?: () => void;
  showToggleButton?: boolean;
}

export default function Header({ onToggleDashboard, showToggleButton }: HeaderProps) {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
  const isNotifOpen = Boolean(notifAnchorEl);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const fetchLiveNotifications = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.get(`${API_BASE_URL}/api/admin/notifications/live-orders?limit=15`, {
        headers,
        withCredentials: true,
      });

      if (res.data?.success && Array.isArray(res.data.notifications)) {
        const cleaned: NotificationItem[] = res.data.notifications.map((n: any) => ({
          ...n,
          id: String(n.id || n._id),
          orderId: String(n.orderId || n._id),
          orderCode: safeText(n.orderCode, 'Order'),
          restaurantName: safeText(n.restaurantName, 'Restaurant'),
          customerName: safeText(n.customerName, 'Customer'),
          title: safeText(n.title, 'Order Notification'),
          description: safeText(n.description, ''),
        }));
        setNotifications(cleaned);
        const unread = typeof res.data.unreadCount === 'number'
          ? res.data.unreadCount
          : cleaned.filter((n: NotificationItem) => !n.read).length;
        setUnreadCount(unread);
        return;
      }
    } catch (err) {
      // Fallback to order-dashboard
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const fallback = await axios.get(`${API_BASE_URL}/api/admin/order-dashboard?limit=10`, {
          headers,
          withCredentials: true,
        });

        if (fallback.data?.recentOrders && Array.isArray(fallback.data.recentOrders)) {
          const list: NotificationItem[] = fallback.data.recentOrders.map((o: any) => {
            const rName = safeText(o.restaurantName || o.restaurant?.name || o.restaurant, 'Restaurant');
            const cName = safeText(o.customerName || o.customer?.name || o.customer, 'Customer');
            const isPickup = o.orderType === 'self_pickup';
            return {
              id: String(o._id || o.id),
              orderId: String(o._id || (o.id ? o.id.replace('#', '') : '')),
              orderCode: String(o.orderCode || o.id),
              restaurantName: rName,
              customerName: cName,
              title: `Order ${o.orderCode || o.id} • ${rName}`,
              description: `${o.inrAmount || o.amount} • ${isPickup ? '🛍️ Pickup' : '🚴 Delivery'}`,
              status: String(o.status || 'placed'),
              orderType: o.orderType || 'delivery',
              amount: Number(o.totalAmount || 0),
              amountFormatted: String(o.inrAmount || o.amount || '₹0.00'),
              createdAt: o.createdAt || new Date().toISOString(),
              read: ['delivered', 'cancelled'].includes(String(o.status).toLowerCase()),
            };
          });
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.read).length);
        }
      } catch (_) {}
    }
  }, []);

  React.useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveNotifications]);

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 15) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClearNotif = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  // Flatten menu for search logic
  const flatMenu = React.useMemo(() => {
    let flat: any[] = [];
    menuItems.forEach(item => {
      if (item.path) flat.push({ text: item.text, path: item.path, icon: item.icon });
      if (item.children) {
        item.children.forEach(child => {
          flat.push({ text: child.text, path: child.path, parent: item.text, icon: item.icon });
        });
      }
    });
    return flat;
  }, []);

  const filteredResults = flatMenu.filter(item =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Stack direction="column" sx={{ width: '100%', bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1100 }}>
      <style>{`
        @keyframes headerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      
      {showToggleButton && onToggleDashboard && (
        <Box sx={{ p: 1, bgcolor: '#000' }}>
          <button onClick={onToggleDashboard} style={{ color: 'white', background: 'none', border: '1px solid white', cursor: 'pointer', padding: '4px 8px' }}>
            🔄 Switch Dashboard
          </button>
        </Box>
      )}

      <Stack 
        direction="row" 
        sx={{ px: 2, py: 1.2, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', gap: { xs: 1, sm: 2 } }}
      >
        {/* Left Section: Drawer toggle (mobile) + Breadcrumbs */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <IconButton
            aria-label="open drawer"
            onClick={onToggleDashboard}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <NavbarBreadcrumbs />
          </Box>
        </Stack>

        {/* Center Section: Looping Marquee Banner "Welcome To ECDKART" */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            maxWidth: { xs: '160px', sm: '280px', md: '420px', lg: '560px' },
            mx: { xs: 0.5, sm: 1.5 },
            py: 0.5,
            px: 1.5,
            borderRadius: '20px',
            bgcolor: 'rgba(36, 140, 112, 0.08)',
            border: '1px solid rgba(36, 140, 112, 0.22)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              whiteSpace: 'nowrap',
              animation: 'headerMarquee 20s linear infinite',
              '&:hover': { animationPlayState: 'paused' },
            }}
          >
            {[1, 2].map((i) => (
              <Typography
                key={i}
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.78rem', sm: '0.85rem' },
                  color: '#047857',
                  letterSpacing: '0.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  pr: 4,
                }}
              >
                <span>✨ Welcome To ECDKART</span>
                <span>•</span>
                <span>🛒 Welcome To ECDKART</span>
                <span>•</span>
                <span>🚀 Welcome To ECDKART</span>
                <span>•</span>
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Right Section: Proper Visible Search Bar + Notifications + Profile Avatar */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {/* Always Visible Search Bar */}
          <ClickAwayListener onClickAway={() => setIsSearchFocused(false)}>
            <Box sx={{ position: 'relative', width: { xs: 130, sm: 200, md: 280 } }}>
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.4,
                  height: 38,
                  borderRadius: '20px',
                  bgcolor: isSearchFocused ? '#ffffff' : '#f3f4f6',
                  border: '1px solid',
                  borderColor: isSearchFocused ? '#248C70' : '#e5e7eb',
                  boxShadow: isSearchFocused ? '0 0 0 3px rgba(36, 140, 112, 0.15)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <SearchRoundedIcon sx={{ color: isSearchFocused ? '#248C70' : '#9ca3af', mr: 0.8, fontSize: 19 }} />
                <InputBase
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  sx={{
                    flex: 1,
                    fontSize: '0.84rem',
                    color: '#1f2937',
                    '& input::placeholder': { color: '#9ca3af', opacity: 1 },
                  }}
                />
                {searchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ p: 0.3, color: '#9ca3af', '&:hover': { color: '#4b5563' } }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Paper>

              {/* Search Results Dropdown */}
              {isSearchFocused && searchQuery.trim() !== '' && (
                <Paper
                  elevation={8}
                  sx={{
                    position: 'absolute',
                    top: 44,
                    right: 0,
                    width: { xs: '85vw', sm: 320 },
                    maxHeight: 320,
                    overflowY: 'auto',
                    borderRadius: 3,
                    zIndex: 1200,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <List dense sx={{ py: 0.5 }}>
                    {filteredResults.length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center', color: '#6b7280' }}>
                        <Typography variant="body2">No matching menu items</Typography>
                      </Box>
                    ) : (
                      filteredResults.map((item, i) => (
                        <ListItemAny
                          button
                          key={i}
                          onClick={() => {
                            navigate(item.path);
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          sx={{
                            px: 2,
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(36, 140, 112, 0.08)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: '#248C70' }}>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            secondary={item.parent}
                            primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 600, color: '#111827' }}
                            secondaryTypographyProps={{ fontSize: '0.72rem', color: '#6b7280' }}
                          />
                        </ListItemAny>
                      ))
                    )}
                  </List>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Notifications Trigger */}
            <IconButton onClick={handleNotifClick} size="small" sx={{ p: 0.5 }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsRoundedIcon color="action" />
              </Badge>
            </IconButton>

            {/* Notifications Dropdown Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={isNotifOpen}
              onClose={handleNotifClose}
              PaperProps={{
                elevation: 4,
                sx: {
                  mt: 1.5,
                  width: { xs: 300, sm: 360 },
                  maxHeight: 450,
                  borderRadius: 3,
                  p: 0,
                  border: '1px solid rgba(148, 178, 170, 0.3)',
                  boxShadow: '0 12px 32px rgba(36, 140, 112, 0.15)',
                  overflow: 'hidden'
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, bgcolor: '#F5FAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2C2C2C', fontSize: '0.95rem' }}>
                    Live Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Typography>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '2px 6px',
                    borderRadius: '12px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Live
                  </span>
                </Box>
                {unreadCount > 0 && (
                  <Typography 
                    variant="caption" 
                    onClick={handleMarkAllRead}
                    sx={{ color: '#248C70', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Mark all as read
                  </Typography>
                )}
              </Box>

              <List dense sx={{ py: 0.5, maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>No new notifications</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Orders will appear here in real-time as they are placed
                    </Typography>
                  </Box>
                ) : (
                  notifications.map((notif) => (
                    <ListItem 
                      key={notif.id}
                      onClick={() => {
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        if (notif.orderId) {
                          navigate(`/view-order/${notif.orderId}`);
                          handleNotifClose();
                        }
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        bgcolor: notif.read ? 'transparent' : 'rgba(36, 140, 112, 0.08)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        borderBottom: '1px solid #f0f0f0',
                        '&:hover': { bgcolor: 'rgba(36, 140, 112, 0.14)' },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ pr: 1, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: notif.read ? 600 : 800, color: '#1f2937', fontSize: '0.86rem' }}>
                            {safeText(notif.orderCode, 'Order')} • <span style={{ color: '#047857' }}>{safeText(notif.restaurantName, 'Restaurant')}</span>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#4b5563', display: 'block', mt: 0.3, fontSize: '0.76rem' }}>
                            {safeText(notif.description)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.6 }}>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: notif.status === 'delivered' ? '#d1fae5' : notif.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                              color: notif.status === 'delivered' ? '#065f46' : notif.status === 'cancelled' ? '#991b1b' : '#92400e',
                            }}>
                              {safeText(notif.status, 'PLACED')}
                            </span>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                              {getRelativeTime(notif.createdAt)}
                            </Typography>
                          </Box>
                        </Box>

                        <IconButton 
                          size="small" 
                          onClick={(e) => handleClearNotif(notif.id, e)} 
                          sx={{ color: 'gray', '&:hover': { color: 'error.main' }, p: 0.5 }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>✕</Typography>
                        </IconButton>
                      </Box>

                      {/* View Live Order button */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            if (notif.orderId) {
                              navigate(`/view-order/${notif.orderId}`);
                              handleNotifClose();
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            backgroundColor: '#047857',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <span>View Live Order</span>
                          <span style={{ fontSize: '11px' }}>↗</span>
                        </button>
                      </Box>
                    </ListItem>
                  ))
                )}
              </List>
            </Menu>

            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>Admin</Typography>
            
            {/* Profile Avatar Trigger */}
            <Avatar 
              onClick={handleProfileClick}
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: '#248C70', 
                color: '#ffffff', 
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: '2px solid #94B2AA',
                boxShadow: '0 2px 8px rgba(36, 140, 112, 0.25)',
                '&:hover': { bgcolor: '#1c6d57' } 
              }}
            >
              AD
            </Avatar>

            {/* Logout Only Menu */}
            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 2,
                sx: { mt: 1.5, minWidth: 140, filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))' }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutRoundedIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  primaryTypographyProps={{ fontSize: '14px', color: 'error.main', fontWeight: 500 }} 
                />
              </MenuItem>
            </Menu>

          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}