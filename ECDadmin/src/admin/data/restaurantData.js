import {
  Star,
  StarBorder,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutline,
  ContentCopyOutlined,
} from "@mui/icons-material";
import { Chip, Stack, Tooltip } from "@mui/material";
import toast from "react-hot-toast";



export const initialRestaurantFormState = {
  ownerName: "",
  ownerEmail: "",
  ownerMobile: "",
  ownerPassword: "",
  ownerPin: "1234",

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
    latitude: "",
    longitude: "",
  },

  deliveryType: [],
  deliveryTime: "30-40 mins",

  packagingCharge: "",
  adminCommission: "",

  documents: {
    fssai: { number: "", expiry: "", file: null },
    gst: { number: "", file: null },
    pan: { number: "", name: "", file: null },
  },

  bankDetails: {
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountHolderName: "",
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

    {
      key: "name",
      label: "Name",
      render: (row) => {
        const n = typeof row.name === 'object' && row.name !== null
          ? (row.name.en || Object.values(row.name).find(v => typeof v === 'string' && v.trim()) || '-')
          : (row.name || '-');
        return <span className="font-semibold text-gray-900">{n}</span>;
      }
    },
    
    {
      key: "ownerId",
      label: "Owner",
      render: (row) => {
        if (row.ownerName && row.ownerName !== 'Restaurant') return row.ownerName;
        if (row.ownerId && row.ownerId !== 'Restaurant') return row.ownerId;
        const n = typeof row.name === 'object' && row.name !== null
          ? (row.name.en || Object.values(row.name)[0])
          : row.name;
        return n && n !== 'Restaurant' ? `${n} Owner` : '-';
      }
    },

    {
      key: "email",
      label: "Email",
      render: (row) => row.email || row.ownerEmail || "-",
    },

    { key: "address", label: "Address" },

    {
      key: "contact",
      label: "Contact",
      render: (row) => row.contact || row.contactNumber || row.ownerMobile || "-",
    },

    {
      key: "pin",
      label: "Login PIN",
      render: (row) => (
        <Chip
          label={row.pin || row.ownerPin || "1234"}
          color="primary"
          variant="outlined"
          size="small"
        />
      ),
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
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="View Details">
            <VisibilityOutlined
              fontSize="small"
              className="cursor-pointer text-gray-600 hover:text-blue-600 transition-colors"
              onClick={() => navigate(`/restaurant/${row._id || row.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit Restaurant">
            <EditOutlined
              fontSize="small"
              className="cursor-pointer text-gray-600 hover:text-emerald-600 transition-colors"
              onClick={() => navigate(`/edit-restaurant/${row._id || row.id}`)}
            />
          </Tooltip>
          <Tooltip title="Delete Restaurant">
            <DeleteOutline
              fontSize="small"
              className="cursor-pointer text-gray-600 hover:text-red-600 transition-colors"
              onClick={() => onDeleteClick && onDeleteClick(row)}
            />
          </Tooltip>
          <Tooltip title="Copy Details">
            <ContentCopyOutlined
              fontSize="small"
              className="cursor-pointer text-gray-600 hover:text-amber-600 transition-colors"
              onClick={() => {
                const targetId = row._id || row.id || "";
                const rName = typeof row.name === 'object' ? (row.name.en || Object.values(row.name)[0]) : row.name;
                const textToCopy = `Restaurant: ${rName}\nID: ${targetId}\nContact: ${row.contact || '-'}\nPIN: ${row.pin || '1234'}`;
                navigator.clipboard.writeText(textToCopy);
                toast.success(`Copied details of "${rName}" to clipboard!`);
              }}
            />
          </Tooltip>
        </Stack>
      ),
    },
  ];
};
