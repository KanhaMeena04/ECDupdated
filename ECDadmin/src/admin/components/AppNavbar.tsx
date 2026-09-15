import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SideMenuMobile from './SideMenuMobile';
import MenuButton from './MenuButton';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import Search from './Search';

const Toolbar = styled(MuiToolbar)({
  width: '100%',
  // padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  justifyContent: 'center',
  gap: '12px',
  flexShrink: 0,
  [`& ${tabsClasses.flexContainer}`]: {
    gap: '8px',
    p: '8px',
    pb: 0,
  },
});

export default function AppNavbar({ open: propOpen, toggleDrawer: propToggleDrawer }: { open?: boolean; toggleDrawer?: (newOpen: boolean) => () => void }) {
  const [localOpen, setLocalOpen] = React.useState(false);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);

  const effectiveToggleDrawer = propToggleDrawer ?? ((newOpen: boolean) => () => {
    setLocalOpen(newOpen);
  });

  const open = typeof propOpen === 'boolean' ? propOpen : localOpen;

  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'auto', md: 'none' },
        boxShadow: 0,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 'var(--template-frame-height, 0px)',
      }}
    >
      <Toolbar variant="regular">
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            flexGrow: 1,
            width: '100%',
            gap: 1,
          }}
        >
          {/* 1. Menu Button moved to the left */}
          <MenuButton aria-label="menu" onClick={effectiveToggleDrawer(true)}>
            <MenuRoundedIcon />
          </MenuButton>

          {/* 2. Logo Stack - changed mr: 'auto' to ensure it stays next to menu or pushes theme to right */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'start', flexGrow: 1 }}
          >
          </Stack>

          {/* 3. Theme toggle stays on the right */}
           <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Search />
                    <MenuButton showBadge aria-label="Open notifications" onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
                      <NotificationsRoundedIcon />
                    </MenuButton>
                    <Menu
                      anchorEl={notifAnchorEl}
                      open={Boolean(notifAnchorEl)}
                      onClose={() => setNotifAnchorEl(null)}
                      PaperProps={{
                        elevation: 4,
                        sx: { mt: 1.5, width: 280, borderRadius: 3, p: 1 }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 700, borderBottom: '1px solid #eee' }}>
                        Notifications
                      </Typography>
                      <MenuItem onClick={() => setNotifAnchorEl(null)}>
                        <Typography variant="body2">🔔 New Order #1094 Received</Typography>
                      </MenuItem>
                      <MenuItem onClick={() => setNotifAnchorEl(null)}>
                        <Typography variant="body2">🛵 Rider assigned to Order #1089</Typography>
                      </MenuItem>
                    </Menu>
                  </Stack>
          
          <SideMenuMobile open={open} toggleDrawer={effectiveToggleDrawer} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

// ... CustomIcon function remains the same
export function CustomIcon() {
  return (
    <Box
      sx={{
        width: '1.5rem',
        height: '1.5rem',
        bgcolor: 'black',
        borderRadius: '999px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundImage:
          'linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)',
        color: 'hsla(210, 100%, 95%, 0.9)',
        border: '1px solid',
        borderColor: 'hsl(210, 100%, 55%)',
        boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.3)',
      }}
    >
      <DashboardRoundedIcon color="inherit" sx={{ fontSize: '1rem' }} />
    </Box>
  );
}
