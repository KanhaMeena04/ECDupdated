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
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import { menuItems } from './MenuContent'; 

const ListItemAny: any = ListItem; 

interface HeaderProps {
  onToggleDashboard?: () => void;
  showToggleButton?: boolean;
}

export default function Header({ onToggleDashboard, showToggleButton }: HeaderProps) {
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
  const isNotifOpen = Boolean(notifAnchorEl);
  const [notifications, setNotifications] = React.useState([
    { id: 1, title: 'New Order Received #1094', time: '2 mins ago', read: false },
    { id: 2, title: 'Rider Rahul assigned to Order #1089', time: '15 mins ago', read: false },
    { id: 3, title: 'Restaurant "Royal Spice" added 4 items', time: '1 hour ago', read: false },
    { id: 4, title: 'New User registered on platform', time: '2 hours ago', read: false },
    { id: 5, title: 'Daily Sales Report generated', time: '4 hours ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotif = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
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
      
      {showToggleButton && onToggleDashboard && (
        <Box sx={{ p: 1, bgcolor: '#000' }}>
          <button onClick={onToggleDashboard} style={{ color: 'white', background: 'none', border: '1px solid white', cursor: 'pointer', padding: '4px 8px' }}>
            🔄 Switch Dashboard
          </button>
        </Box>
      )}

      <Stack 
        direction="row" 
        sx={{ px: 2, py: 1.5, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {!isSearchExpanded && (
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              aria-label="open drawer"
              onClick={onToggleDashboard}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <StarBorderRoundedIcon sx={{ color: '#ff9800', display: { xs: 'none', md: 'block' } }} />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <NavbarBreadcrumbs />
            </Box>
          </Stack>
        )}

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: isSearchExpanded ? 1 : 0, justifyContent: 'flex-end' }}>
          <ClickAwayListener onClickAway={() => setIsSearchExpanded(false)}>
            <Box sx={{ position: 'relative', width: isSearchExpanded ? '100%' : 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', bgcolor: isSearchExpanded ? 'action.hover' : 'transparent',
                borderRadius: 2, px: isSearchExpanded ? 1 : 0, width: isSearchExpanded ? '35%' : 40, height: 40, border: isSearchExpanded ? '1px solid #ddd' : 'none'
              }}>
                <IconButton onClick={() => setIsSearchExpanded(true)}><SearchRoundedIcon /></IconButton>
                {isSearchExpanded && (
                  <InputBase
                    autoFocus
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ ml: 1, flex: 1 }}
                  />
                )}
              </Box>

              {isSearchExpanded && searchQuery && (
                <Paper sx={{ position: 'absolute', top: 50, right: 0, width: { xs: '90vw', sm: 350 }, zIndex: 1000 }}>
                  <List dense>
                    {filteredResults.map((item, i) => (
                      <ListItemAny button key={i} onClick={() => { navigate(item.path); setIsSearchExpanded(false); }}>
                        <ListItemIcon sx={{ minWidth: 35 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} secondary={item.parent} />
                      </ListItemAny>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>

          {!isSearchExpanded && (
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2C2C2C', fontSize: '0.95rem' }}>
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Typography>
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

                <List dense sx={{ py: 0.5, maxHeight: 340, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'gray' }}>
                      <Typography variant="body2">No notifications remaining</Typography>
                    </Box>
                  ) : (
                    notifications.map((notif) => (
                      <ListItem 
                        key={notif.id}
                        onClick={() => {
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        }}
                        sx={{
                          py: 1.2,
                          px: 2,
                          bgcolor: notif.read ? 'transparent' : 'rgba(36, 140, 112, 0.08)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          borderBottom: '1px solid #f0f0f0',
                          '&:hover': { bgcolor: 'rgba(36, 140, 112, 0.12)' },
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ pr: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: notif.read ? 500 : 700, color: '#2C2C2C', fontSize: '0.85rem' }}>
                            {notif.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2, fontSize: '0.75rem' }}>
                            {notif.time}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={(e) => handleClearNotif(notif.id, e)} sx={{ color: 'gray', '&:hover': { color: 'error.main' } }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>✕</Typography>
                        </IconButton>
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
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}