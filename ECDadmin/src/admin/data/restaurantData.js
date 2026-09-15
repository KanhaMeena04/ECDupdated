import {
  LoginOutlined,
  PublicOutlined,
  Star,
  StarBorder,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutline,
  ContentCopyOutlined,
} from "@mui/icons-material";
import { Chip, Stack } from "@mui/material";



export const initialRestaurantFormState = {
  ownerName: "",
  ownerEmail: "",
  ownerMobile: "",
  ownerPassword: "",

  name: {
    en: "",
    de: "",
    ar: "",
  },
  description: {
    en: "",
  },

  brand: "",
  cuisine: [],

  image: "",

  email: "",
  contactNumber: "",
  address: "",
  city: "",
  area: "",

  location: {
    type: "Point",
    coordinates: ["", ""], // lng, lat
  },

  deliveryTime: "",
  geofenceRadius: "",
  deliveringZones: [],

  deliveryType: [],
  paymentMethods: "Both",

  packagingCharge: "",
  adminCommission: "",

  isFreeDelivery: false,
  freeDeliveryContribution: 0,
  totalFreeDeliverySpend: 0,

  isActive: true,

  rating: 0,

  bankDetails: {
    accountName: "",
    bankName: "",
    accountAddress: "",
    branchName: "",
    accountNumber: "",
    branchAddress: "",
    swiftCode: "",
    routingNumber: "",
  },

  timing: {
    monday: { open: "", close: "", isClosed: false },
    tuesday: { open: "", close: "", isClosed: false },
    wednesday: { open: "", close: "", isClosed: false },
    thursday: { open: "", close: "", isClosed: false },
    friday: { open: "", close: "", isClosed: false },
    saturday: { open: "", close: "", isClosed: false },
    sunday: { open: "", close: "", isClosed: false },
    isHoliday: false,
  },
};

export const getRestaurantColumns = ({
  navigate,
  formatDate,
  onDeleteClick,
}) => {
  const RatingStars = ({ value = 0 }) => (
    <Stack direction="row" spacing={0.5}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= value ? (
          <Star key={i} fontSize="small" sx={{ color: "#fb8c00" }} />
        ) : (
          <StarBorder key={i} fontSize="small" sx={{ color: "#fb8c00" }} />
        )
      )}
    </Stack>
  );

  return [
    { key: "index", label: "" },

    { key: "name", label: "Name" },
    
    {key:"ownerId", label:"OwnerId"  },

    // {
    //   key: "login",
    //   label: "Direct Login",
    //   render: () => (
    //     <Stack direction="row" spacing={1}>
    //       <LoginOutlined fontSize="small" />
    //       <PublicOutlined fontSize="small" />
    //     </Stack>
    //   ),
    // },

    {
      key: "email",
      label: "Email",
      render: () => "**********",
    },

    { key: "address", label: "Address" },

    {
      key: "contact",
      label: "Contact",
      render: () => "**********",
    },

    {
      key: "rating",
      label: "Ratings",
      render: (row) => <RatingStars value={row.rating} />,
    },

    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status}
          color={row.status === "Active" ? "success" : "warning"}
          variant="outlined"
          size="small"
        />
      ),
    },

    {
      key: "openStatus",
      label: "Open Status",
      render: (row) => (
        <Chip
          label={row.openStatus}
          color={row.openStatus.includes("Not") ? "warning" : "success"}
          size="small"
        />
      ),
    },

    {
      key: "createdOn",
      label: "Created On",
      render: (row) => formatDate(row.createdOn),
    },

    {
      key: "action",
      label: "Action",
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <VisibilityOutlined
            fontSize="small"
            className="cursor-pointer hover:text-blue-500"
            onClick={() =>
              navigate(`/restaurant/${row._id || row.id}`)
            }
          />
          <EditOutlined
            fontSize="small"
            className="cursor-pointer hover:text-green-500"
            onClick={() =>
              navigate(`/edit-restaurant/${row._id || row.id}`)
            }
          />
          <DeleteOutline
            fontSize="small"
            className="cursor-pointer hover:text-red-500"
             onClick={() => onDeleteClick(row)}
          />
          <ContentCopyOutlined
            fontSize="small"
            className="cursor-pointer hover:text-gray-500"
            onClick={() => console.log("Copy:", row._id || row.id)}
          />
        </Stack>
      ),
    },
  ];
};

