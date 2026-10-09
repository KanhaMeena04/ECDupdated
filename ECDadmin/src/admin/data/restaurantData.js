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

  deliveryType: ["Home Delivery", "Pickup", "Both"],
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
  onToggleStatus,
  statusLoadingId,
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
      key: "restaurantId",
      label: "Restaurant ID",
      render: (row, idx) => {
        const idVal = (row.restaurantId && /^RNT\d+/i.test(row.restaurantId))
          ? row.restaurantId.toUpperCase()
          : `RNT${String(idx + 1).padStart(3, '0')}`;
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {idVal}
          </span>
        );
      }
    },

    {
      key: "name",
      label: "Name",
      render: (row) => {
        const n = typeof row.name === 'object' && row.name !== null
          ? (row.name.en || Object.values(row.name).find(v => typeof v === 'string' && v.trim()) || '-')
          : (row.name || '-');
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{n}</span>
            {row.restaurantId && (
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">{row.restaurantId}</span>
            )}
          </div>
        );
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
      render: (row) => {
        const isActive = row.status === "Active" || row.isActive === true;
        const rowId = row._id || row.id;
        const isLoading = statusLoadingId === rowId;

        return (
          <Tooltip title={`Click to turn ${isActive ? "Inactive (Offline)" : "Active (Online)"}`}>
            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleStatus) onToggleStatus(row);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
              } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span>{isLoading ? "Updating..." : (isActive ? "Active" : "Inactive")}</span>
            </button>
          </Tooltip>
        );
      },
    },

    {
      key: "openStatus",
      label: "Open Status",
      render: (row) => {
        const isOpen =
          (row.openStatus === "Accepting Orders" || row.openStatus === "Open") &&
          (row.status === "Active" || row.isActive === true);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOpen
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? "bg-emerald-600" : "bg-amber-600"
              }`}
            />
            {isOpen ? "Accepting Orders" : "Closed / Offline"}
          </span>
        );
      },
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
