import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PageHeader from "../../components/PageHeader";
import {
  Button,
  Chip,
  Switch,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Eye,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../../utils/utils";

const EditRestaurantMenuForm = () => {
  const params = useParams();
  const restaurantId = params.restaurantId || params.id || "";
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Restaurant details & auto-approve switch
  const [restaurant, setRestaurant] = useState(null);
  const [autoApproveMenu, setAutoApproveMenu] = useState(false);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states for Add / Edit
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Main Course");
  const [itemFoodType, setItemFoodType] = useState("veg");
  const [itemSellingPrice, setItemSellingPrice] = useState("");
  const [itemMrp, setItemMrp] = useState("");
  const [itemB2bPrice, setItemB2bPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemOos, setItemOos] = useState(false);
  const [itemPreparationTime, setItemPreparationTime] = useState("15");
  const [submitting, setSubmitting] = useState(false);

  // Bulk File Upload state
  const [bulkFile, setBulkFile] = useState(null);

  // Fetch Menu & Restaurant Profile
  const fetchMenu = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Menu
      const res = await axios.get(`${API_BASE_URL}/api/menu/${restaurantId}?includePending=true`, {
        headers,
        withCredentials: true,
      });
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setMenu(items);

      // 2. Fetch Restaurant Profile for autoApproveMenu setting
      const restRes = await axios.get(`${API_BASE_URL}/api/restaurants/${restaurantId}`, {
        headers,
        withCredentials: true,
      }).catch(() => null);

      if (restRes?.data) {
        const restObj = restRes.data.restaurant || restRes.data;
        setRestaurant(restObj);
        setAutoApproveMenu(Boolean(restObj.autoApproveMenu));
      }
    } catch (err) {
      console.error("Failed to load menu items:", err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchMenu();
    } else {
      setLoading(false);
    }
  }, [restaurantId]);

  // Toggle Auto-Approve Menu for Restaurant
  const handleToggleAutoApprove = async () => {
    try {
      const nextVal = !autoApproveMenu;
      setAutoApproveMenu(nextVal);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/restaurants/admin/${restaurantId}`,
        { autoApproveMenu: nextVal },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
      );
      toast.success(nextVal ? "Auto-Approve Menu enabled for this restaurant!" : "Auto-Approve disabled (Requires Admin Review)");
    } catch (err) {
      toast.error("Failed to update auto-approve setting");
    }
  };

  // Toggle Item Out Of Stock (OOS)
  const handleToggleOos = async (item) => {
    try {
      const token = localStorage.getItem("token");
      const nextVal = !item.available;
      await axios.put(
        `${API_BASE_URL}/api/menu/item/${item._id}/availability`,
        { available: nextVal },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
      );
      toast.success(`${item.name} is now ${nextVal ? "IN STOCK" : "OUT OF STOCK"}`);
      fetchMenu();
    } catch (err) {
      toast.error("Failed to toggle availability");
    }
  };

  // Approve Item
  const handleApproveItem = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/admin/menu/${productId}/approve`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
      );
      toast.success("Menu item approved!");
      fetchMenu();
    } catch (err) {
      toast.error("Failed to approve menu item");
    }
  };

  // Reject Item
  const handleRejectItem = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/admin/menu/${productId}/reject`,
        { rejectionReason: "Rejected by admin" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
      );
      toast.success("Menu item rejected");
      fetchMenu();
    } catch (err) {
      toast.error("Failed to reject item");
    }
  };

  // Delete Item
  const handleDeleteItem = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/menu/item/${productId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      toast.success("Menu item deleted");
      fetchMenu();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete menu item");
    }
  };

  // Open Add Item Modal
  const openAddModal = () => {
    setEditingItem(null);
    setItemName("");
    setItemCategory("Main Course");
    setItemFoodType("veg");
    setItemSellingPrice("");
    setItemMrp("");
    setItemB2bPrice("");
    setItemDescription("");
    setItemImage("");
    setItemOos(false);
    setItemPreparationTime("15");
    setAddModalOpen(true);
  };

  // Open Edit Item Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.name || "");
    setItemCategory(item.category?.name || item.category || "Main Course");
    setItemFoodType(item.foodType || (item.isVeg !== false ? "veg" : "non-veg"));
    setItemSellingPrice(item.sellingPrice || item.basePrice || "");
    setItemMrp(item.mrp || item.sellingPrice || "");
    setItemB2bPrice(item.b2bPrice || item.b2bSellingPrice || item.sellingPrice || "");
    setItemDescription(item.description || "");
    setItemImage(item.image || "");
    setItemOos(!item.available);
    setItemPreparationTime(item.preparationTime || "15");
    setAddModalOpen(true);
  };

  // Save / Update Menu Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemSellingPrice) {
      toast.error("Please provide Item Name and Selling Price");
      return;
    }
    if (!itemImage || !itemImage.trim()) {
      toast.error("Dish Photo is mandatory! Please upload or enter a photo.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        name: itemName.trim(),
        description: itemDescription.trim(),
        category: itemCategory,
        sellingPrice: Number(itemSellingPrice),
        basePrice: Number(itemSellingPrice),
        mrp: Number(itemMrp || itemSellingPrice),
        b2cSellingPrice: Number(itemSellingPrice),
        b2cMrp: Number(itemMrp || itemSellingPrice),
        b2bSellingPrice: Number(itemB2bPrice || itemSellingPrice),
        foodType: itemFoodType,
        isVeg: itemFoodType === "veg",
        available: !itemOos,
        preparationTime: Number(itemPreparationTime || 15),
        image: itemImage,
      };

      if (editingItem) {
        await axios.put(`${API_BASE_URL}/api/menu/item/${editingItem._id}`, payload, { headers, withCredentials: true });
        toast.success("Menu item updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/api/menu/${restaurantId}/bulk-upload`, { items: [payload] }, { headers, withCredentials: true });
        toast.success("New menu item added & approved!");
      }

      setAddModalOpen(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save menu item");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Upload Menu
  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error("Please select a JSON or CSV menu file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setSubmitting(true);
        const text = e.target.result;
        let items = [];

        if (bulkFile.name.endsWith(".json")) {
          items = JSON.parse(text);
        } else {
          // Parse CSV
          const lines = text.split("\n").filter((l) => l.trim());
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim());
            if (cols.length >= 2) {
              const item = {};
              headers.forEach((h, idx) => { item[h] = cols[idx] || ""; });
              items.push({
                name: item.name || item["item name"] || `Item ${i}`,
                price: Number(item.price || item["selling price"] || 0),
                mrp: Number(item.mrp || item.price || 0),
                b2bPrice: Number(item.b2bprice || item["b2b price"] || 0),
                category: item.category || "Main Course",
                foodType: item.foodtype || item["food type"] || "veg",
                description: item.description || "",
                image: item.image || "",
              });
            }
          }
        }

        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${API_BASE_URL}/api/menu/${restaurantId}/bulk-upload`,
          { items },
          { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
        );

        toast.success(res.data.message || "Bulk menu uploaded successfully!");
        setBulkModalOpen(false);
        fetchMenu();
      } catch (err) {
        toast.error("Failed to parse or upload menu file");
      } finally {
        setSubmitting(false);
      }
    };
    reader.readAsText(bulkFile);
  };

  // Filtered Menu Items
  const filteredMenu = menu.filter((item) => {
    const nameStr = (item.name?.en || item.name || "").toLowerCase();
    const catStr = (item.category?.name || item.category || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(query) || catStr.includes(query);
    const matchesCategory = categoryFilter === "all" || catStr === categoryFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && (item.isApproved || item.approvalStatus === "approved")) ||
      (statusFilter === "pending" && !item.isApproved && item.approvalStatus === "pending") ||
      (statusFilter === "oos" && !item.available);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const approvedCount = menu.filter((i) => i.isApproved || i.approvalStatus === "approved").length;
  const pendingCount = menu.filter((i) => !i.isApproved && i.approvalStatus === "pending").length;
  const oosCount = menu.filter((i) => !i.available).length;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Restaurant Menu Master Control"
          breadcrumbs={[
            { label: "Restaurants", active: false },
            { label: restaurant?.name?.en || restaurant?.name || "Menu Master", active: true },
          ]}
        />

        <div className="flex items-center gap-3 flex-wrap">
          {/* Auto Approve Toggle */}
          <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
            <Zap size={16} className={autoApproveMenu ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
            <div>
              <span className="text-xs font-bold text-slate-800 block leading-none">Auto-Approve Menu</span>
              <span className="text-[10px] text-slate-400 leading-none">Trusted Restaurant</span>
            </div>
            <Switch
              size="small"
              checked={autoApproveMenu}
              onChange={handleToggleAutoApprove}
              color="primary"
            />
          </div>

          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
          >
            <Upload size={15} />
            Bulk Upload Menu
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Add Food Item
          </button>

          <button
            onClick={fetchMenu}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Menu Items</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{menu.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved & Live</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Admin Review</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Out Of Stock (OOS)</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{oosCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search food dish name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses ({menu.length})</option>
            <option value="approved">Approved Live ({approvedCount})</option>
            <option value="pending">Pending Review ({pendingCount})</option>
            <option value="oos">Out of Stock ({oosCount})</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="main course">Main Course</option>
            <option value="starters & snacks">Starters & Snacks</option>
            <option value="breads & rice">Breads & Rice</option>
            <option value="beverages & shakes">Beverages & Shakes</option>
            <option value="desserts">Desserts</option>
          </select>
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={32} />
            <p className="text-slate-500 text-xs font-medium">Fetching restaurant menu...</p>
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="text-slate-300 mx-auto mb-3" size={40} />
            <h4 className="text-sm font-bold text-slate-700">No Food Items Found</h4>
            <p className="text-xs text-slate-400 mt-1">Try changing filters or add your first food item.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-3.5 px-4">Dish</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">MRP / B2B Price</th>
                <th className="py-3.5 px-4 text-center">Stock Status</th>
                <th className="py-3.5 px-4">Approval Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenu.map((item) => {
                const isApproved = item.isApproved || item.approvalStatus === "approved";
                const isPending = !isApproved && item.approvalStatus === "pending";
                const isRejected = item.approvalStatus === "rejected";
                const isVeg = item.isVeg !== false;
                const sellingPrice = item.sellingPrice || item.basePrice || 0;
                const mrp = item.mrp || sellingPrice;
                const b2b = item.b2bPrice || item.pricing?.b2b?.sellingPrice || sellingPrice;

                return (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    {/* Dish Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">
                            {(item.name || "D").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {item.name?.en || item.name}
                          </span>
                          {item.description && (
                            <span className="text-[10px] text-slate-400 block max-w-xs truncate mt-0.5">
                              {item.description?.en || item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {item.category?.name?.en || item.category?.name || item.category || "Main Course"}
                      </span>
                    </td>

                    {/* Food Type Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                          isVeg ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-emerald-600" : "bg-rose-600"}`}></span>
                        {isVeg ? "VEG" : "NON-VEG"}
                      </span>
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      ₹{Number(sellingPrice).toLocaleString("en-IN")}
                    </td>

                    {/* MRP / B2B */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {mrp > sellingPrice && (
                          <span className="line-through text-slate-400 block text-[11px]">
                            MRP: ₹{mrp}
                          </span>
                        )}
                        <span className="text-blue-700 font-semibold text-[11px] block">
                          B2B: ₹{b2b}
                        </span>
                      </div>
                    </td>

                    {/* Out of Stock Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Switch
                          size="small"
                          checked={Boolean(item.available)}
                          onChange={() => handleToggleOos(item)}
                          color="success"
                        />
                        <span className={`text-[10px] font-bold ${item.available ? "text-emerald-600" : "text-rose-500"}`}>
                          {item.available ? "In Stock" : "OOS"}
                        </span>
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-4">
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={11} />
                          Live & Approved
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={11} />
                          Pending Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={11} />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveItem(item._id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[11px] transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectItem(item._id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md font-semibold text-[11px] transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <IconButton size="small" onClick={() => openEditModal(item)} sx={{ color: "#475569" }}>
                          <Edit size={14} />
                        </IconButton>

                        <IconButton size="small" onClick={() => handleDeleteItem(item._id)} sx={{ color: "#EF4444" }}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Food Item Modal */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          {editingItem ? "Edit Food Item" : "Add New Food Item"}
        </DialogTitle>
        <form onSubmit={handleSaveItem}>
          <DialogContent className="space-y-4">
            <TextField
              label="Dish Name *"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              required
              size="small"
              placeholder="e.g. Paneer Butter Masala"
            />

            <div className="grid grid-cols-3 gap-3">
              <TextField
                label="Selling Price (₹) *"
                type="number"
                value={itemSellingPrice}
                onChange={(e) => setItemSellingPrice(e.target.value)}
                fullWidth
                required
                size="small"
                placeholder="240"
              />
              <TextField
                label="MRP (₹)"
                type="number"
                value={itemMrp}
                onChange={(e) => setItemMrp(e.target.value)}
                fullWidth
                size="small"
                placeholder="290"
              />
              <TextField
                label="B2B Price (₹)"
                type="number"
                value={itemB2bPrice}
                onChange={(e) => setItemB2bPrice(e.target.value)}
                fullWidth
                size="small"
                placeholder="210"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={itemCategory}
                  label="Category"
                  onChange={(e) => setItemCategory(e.target.value)}
                >
                  <MenuItem value="Main Course">Main Course</MenuItem>
                  <MenuItem value="Starters & Snacks">Starters & Snacks</MenuItem>
                  <MenuItem value="Breads & Rice">Breads & Rice</MenuItem>
                  <MenuItem value="Beverages & Shakes">Beverages & Shakes</MenuItem>
                  <MenuItem value="Desserts">Desserts</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Food Type</InputLabel>
                <Select
                  value={itemFoodType}
                  label="Food Type"
                  onChange={(e) => setItemFoodType(e.target.value)}
                >
                  <MenuItem value="veg">Veg (Green)</MenuItem>
                  <MenuItem value="non-veg">Non-Veg (Red)</MenuItem>
                  <MenuItem value="egg">Egg (Yellow)</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Image Selection Section: Dual File Browse & URL */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700">
                Dish Photo <span className="text-red-500 font-extrabold">*</span> (Upload File or Enter URL)
              </label>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  startIcon={<Upload size={16} />}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", borderColor: "#00a67e", color: "#00a67e" }}
                >
                  Browse Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setItemImage(evt.target?.result || "");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                <span className="text-xs text-slate-400 font-medium">or paste link below</span>
              </div>

              <TextField
                label="Image URL (Optional)"
                value={itemImage.startsWith("data:") ? "[Local Photo Selected]" : itemImage}
                onChange={(e) => setItemImage(e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />

              {itemImage && (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={itemImage}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-emerald-300 shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-emerald-700">Image Loaded</p>
                    <button
                      type="button"
                      onClick={() => setItemImage("")}
                      className="text-[11px] text-red-600 underline font-medium"
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <TextField
              label="Description"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Rich gravy with Indian spices..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddModalOpen(false)} sx={{ color: "#64748B", fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: "#10B981", "&:hover": { bgcolor: "#059669" }, fontWeight: 700 }}
            >
              {submitting ? "Saving..." : editingItem ? "Update Item" : "Add & Approve Item"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk Menu Upload</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Upload a JSON or CSV file containing restaurant menu items. Items will be automatically validated and imported.
          </p>
          <input
            type="file"
            accept=".json,.csv"
            onChange={(e) => setBulkFile(e.target.files[0])}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkUpload}
            variant="contained"
            disabled={submitting}
            sx={{ bgcolor: "#2563EB", fontWeight: 700 }}
          >
            {submitting ? "Uploading..." : "Import Menu"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EditRestaurantMenuForm;

