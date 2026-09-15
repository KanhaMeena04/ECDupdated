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
  Chat,
  Assignment,
  Store,
  LocationCity,
  DirectionsCar,
  LocalOffer,
  DriveEta,
  Description,
  Cancel,
  Percent,
  Image,
  People,
  ChevronRight,
  RadioButtonUnchecked,
  SettingsApplications,
  AddBoxRounded,
  FoodBank,
  TagFacesOutlined,
  AcUnit,
  Category,
  
} from '@mui/icons-material'
import FilterAlt from "@mui/icons-material/FilterAlt";
import AccountBalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import RestaurantMenu from "@mui/icons-material/RestaurantMenu";
import RateReview from "@mui/icons-material/RateReview";
import Article from "@mui/icons-material/Article";
import Security from "@mui/icons-material/Security";
import BarChart from "@mui/icons-material/BarChart";
import Settings from "@mui/icons-material/Settings";

export const menuItems = [
  { text: 'Dashboard', icon: <HomeRounded />, path: '/dashboard' },

  // {
  //   text: 'Support Chat',
  //   icon: <Chat />,
  //   children: [
  //     { text: 'Chat', path: '/chat' },
  //     { text: 'User & Store Chat', path: '/user-store-chat' },
  //     { text: 'User & Driver Chat', path: '/user-driver-chat' }
  //   ]
  // },

  {
    text: 'Order Management',
    icon: <Assignment />,
    children: [
      { text: 'Orders Dashboard', path: '/order-dashboard' },
      { text: 'New Order', path: '/new-order' },
      { text: 'Processing Order', path: '/processing-order' },
      { text: 'Pickup Order', path: '/pick-up-order' },
      { text: 'Delivered Order', path: '/delivered-order' },
      { text: 'Cancelled Order', path: '/cancelled-order' },
      { text: 'Failed Order', path: '/failed-order' },
      { text: 'Abandon cart', path: '/abandon-cart' },
      { text: 'Refund Order', path: '/order-refund' },
    ]
  },

  {
    text: 'Restaurants',
    icon: <Store />,
    children: [
      { text: 'Restaurants List', path: '/restaurants' },
      { text: 'Active Restaurants List', path: '/active-restaurants' },
      // { text: 'Add Restaurant', path: '/add-restaurants' },
       // { text: 'Eagles view', path: '/eagles-view' },
      {text: 'Admin Create Restaurant ', path: '/admin-create-restaurant' },
      // {text: 'Restaurant  Application', path: '/restaurant-application' },
      {text: 'Pending Restaurants', path: '/pending-restaurants' },
      {text: 'Approve Restaurants', path: '/approve-restaurant' },
      


    ]
  },

  {
    text: 'City Management',
    icon: <LocationCity />,
    children: [
      //  { text: 'Country List', path: '/country-list' },
      //  { text: 'State List', path: '/state-list' },
       { text: 'Add City', path: '/add-city' },
       { text: 'City List', path: '/city-list' },
       { text: 'Zones List', path: '/zones' },

    ]
  },

  {
    text: 'Vehicle Management',
    icon: <DirectionsCar />,
    children: [
      { text: 'Vehicle List', path: '/vehicle-list' },
      { text: 'Add Vehicle', path: '/add-vehicle' },
    ]
  },

  {
    text: 'Brands',
    icon: <LocalOffer />,
    children: [
      { text: 'Brand List', path: '/brands' },
      { text: 'Add Brand', path: '/add-brands' },
      { text: 'Brand Sort', path: '/sort-brands' },
    ]
  },

  {
    text: 'Driver Management',
    icon: <DriveEta />,
    children: [
      { text: 'Driver List', path: '/driver-list' },
      // { text: 'Pending Driver List', path: '/pending-driver-list' },
      // { text: 'Add Drivers', path: '/add-driver' },
      // { text: 'Riders', path: '/riders-in-map' },
      { text: 'Admin Add Rider', path: '/admin-create-driver' },
      { text: 'Pending Rider List', path: '/pending-driver-list' },
      
    ]
  }, 
 
  {
    text: 'Document Management',
    icon: <Description />,
    children: [
      { text: 'Document List', path: '/documents' },
      { text: 'Add Document ', path: '/add-document' },
    ]
  },

  {
    text: 'Cancellation Reasons',
    icon: <Cancel />,
    children: [
      { text: 'Reasons List', path: '/cancellation-reason' },
      { text: 'Add Reasons', path: '/add-reason' },

    ]
  },

  {
    text: 'Promocodes',
    icon: <Percent />,
    children: [
      { text: 'Promocode List', path: '/promocodes' },
      { text: 'Add Promocode ', path: '/add-promocodes' },
      // { text: 'Custom push', path: '/custom-push' },
      // { text: 'Admin Custom Push', path: '/admin-custom-push' },
    ]
  },

  {
    text: 'Restaurant Banner',
    icon: <Image />,
    children: [
      { text: 'Restaurant Banners List', path: '/restaurant-banner' },
      { text: 'Add Restaurant Banners', path: '/add-restaurant-banner' },
    ]
  },


  {
    text: 'User Management',
    icon: <People />,
    path:"/user-management"
    
  },
  {
    text: 'Categories',
    icon: <Category />,
    children: [
      { text: 'Category List', path: '/category' },
      { text: 'Add Category', path: '/add-category' },
      { text: 'Category Sort', path: '/sort-category' },
    ]
  },
  {
    text: 'Units',
    icon: <AcUnit/>,
    children: [
      // { text: 'Unit Symbol List', path: '/unit-symbol-list' },
      // { text: 'Add Unit Symbol', path: '/unit-symbol' },
      { text: 'Unit List', path: '/unit-list' },
      { text: 'Add Unit', path: '/add-unit' },

    ]
  },
  {
    text: 'Tags',
    icon: <TagFacesOutlined />,
    children: [
      { text: 'Tags', path: '/tags' },
      { text: 'Add Tag', path: '/add-tags' },
    ]


  },
  {
    text: 'Cuisines',
    icon: <FoodBank />,
    path:"/cuisine-list"
  },
  {
    text: 'Addons',
    icon: <AddBoxRounded />,
    path:"/addons"
  },
  {
    text: 'Groups',
    icon: <People />,
    children: [
      { text: 'Group List', path: '/group-list' },
      { text: 'Add Group ', path: '/add-group' },
      { text: 'Group Tags List', path: '/group-tag-list' },
      { text: 'Add Group Tag', path: '/add-group-tag' },
    ]
  },
 
  {
  text: "Filter",
  icon: <FilterAlt />,
  children: [
    { text: "Filter Category List", path: "/filter-category" },
    { text: "Filter Category Sort", path: "/filter-category-sort" },
    { text: "Filter Subcategory List", path: "/filter-sub-category" },
  ],
},

{
  text: "Payout",
  icon: <AccountBalanceWallet />,
  children: [
    { text: "Financial Overview", path: "/financial-overview" },
    { text: "Rider Cash & Unfreeze", path: "/rider-cash-management" },
    { text: "Restaurant Payout", path: "/restaurant-payout" },
    { text: "Driver Payout", path: "/driver-payout" },
    { text: "Restaurant Transaction History", path: "/restaurant-transaction-history" },
    { text: "Driver Transaction History", path: "/driver-Transaction-history" },
  ],
},

{
  text: "Food Quantity",
  icon: <RestaurantMenu />,
  children: [
    { text: "Food Quantity List", path: "/food-quantity-list" },
    { text: "Add Food Quantity", path: "/add-food-quantity" },
  ],
},

{
  text: "Reviews and Ratings",
  icon: <RateReview />,
  path: "/reviews-ratings",
},

{
  text: "Content Management",
  icon: <Article />,
  children: [
    { text: "Privacy Policy", path: "/privacy-policy" },
    { text: "Terms and Conditions", path: "/terms-condition" },
    { text: "FAQ", path: "/faq" },
    { text: "About", path: "/about-us" },
    { text: "contact", path: "/contact" },
    { text: "Landing Page", path: "/landing-page" },
  ],
},

{
  text: "Roles",
  icon: <Security />,
  children: [
    { text: "Create Role", path: "/create-role" },
    { text: "Role List", path: "/role" },
    { text: "Create Staff", path: "/create-staff" },
    { text: "Staff List", path: "/staff" },
  ],
},

{
  text: "Reports",
  icon: <BarChart />,
  children: [
    { text: "Restaurant Reports", path: "/restaurant-report" },
    { text: "Delivery People Reports", path: "/delivery-report" },
    { text: "Order Reports", path: "/order-report" },
    { text: "Top Users Reports", path: "/top-user-report" },
    { text: "Wallet Reports", path: "/wallet-report" },
],},
 {
    text: 'Settings',
    icon: <SettingsApplications/>,
    path:"/setting"
  },

  
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
              mx: 1, // Adds a little gap from the sidebar edges
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