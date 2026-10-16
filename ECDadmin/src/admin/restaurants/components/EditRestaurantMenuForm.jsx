import React, { useEffect, useState, useMemo } from "react";
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
  Autocomplete,
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
  const [systemCategories, setSystemCategories] = useState([]);
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

  // Portion and Sizing State (none | half_full | size)
  const [itemPortionType, setItemPortionType] = useState("none");
  // Half / Full
  const [halfSellingPrice, setHalfSellingPrice] = useState("");
  const [halfMrp, setHalfMrp] = useState("");
  const [halfB2bPrice, setHalfB2bPrice] = useState("");
  const [fullSellingPrice, setFullSellingPrice] = useState("");
  const [fullMrp, setFullMrp] = useState("");
  const [fullB2bPrice, setFullB2bPrice] = useState("");
  // Small / Medium / Large
  const [smallSellingPrice, setSmallSellingPrice] = useState("");
  const [smallMrp, setSmallMrp] = useState("");
  const [smallB2bPrice, setSmallB2bPrice] = useState("");
  const [medSellingPrice, setMedSellingPrice] = useState("");
  const [medMrp, setMedMrp] = useState("");
  const [medB2bPrice, setMedB2bPrice] = useState("");
  const [largeSellingPrice, setLargeSellingPrice] = useState("");
  const [largeMrp, setLargeMrp] = useState("");
  const [largeB2bPrice, setLargeB2bPrice] = useState("");
  // Add-ons list: [{ name: '', price: 0 }]
  const [itemAddOns, setItemAddOns] = useState([]);

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

  // Fetch full system categories list from DB
  useEffect(() => {
    const fetchSystemCategories = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
        const res = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }).catch(() => null);
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const names = list.map((c) => typeof c === 'string' ? c : (c.name?.en || c.name || "")).filter(Boolean);
          setSystemCategories(names);
        }
      } catch (err) {
        console.warn("Failed to fetch system categories:", err);
      }
    };
    fetchSystemCategories();
  }, []);

  // Toggle Auto-Approve Menu for Restaurant
  const handleToggleAutoApprove = async () => {
    const prevVal = autoApproveMenu;
    const nextVal = !prevVal;
    try {
      setAutoApproveMenu(nextVal);
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      await axios.put(
        `${API_BASE_URL}/api/restaurants/admin/${restaurantId}`,
        { autoApproveMenu: nextVal },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
      );
      toast.success(nextVal ? "Auto-Approve Menu enabled for this restaurant!" : "Auto-Approve disabled (Requires Admin Review)");
    } catch (err) {
      console.error("Auto-approve error:", err);
      setAutoApproveMenu(prevVal);
      toast.error(err?.response?.data?.message || "Failed to update auto-approve setting");
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

  // Download Sample Menu JSON Template
  const handleDownloadMenuTemplate = () => {
    const sample = [
      {
        name: "Paneer Butter Masala (Full/Half Plate)",
        price: 240,
        mrp: 290,
        b2bPrice: 200,
        category: "Main Course",
        foodType: "veg",
        description: "Rich creamy tomato gravy with soft cottage cheese cubes",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80",
        portionType: "half_full",
        portions: {
          half: {
            sellingPrice: 140,
            mrp: 170,
            b2bPrice: 120
          },
          full: {
            sellingPrice: 240,
            mrp: 290,
            b2bPrice: 200
          }
        },
        addOns: [
          { name: "Extra Butter", price: 20 },
          { name: "Extra Paneer Cubes", price: 50 }
        ]
      },
      {
        name: "Farmhouse Cheesy Pizza (S/M/L Sizes)",
        price: 199,
        mrp: 249,
        b2bPrice: 160,
        category: "Pizza",
        foodType: "veg",
        description: "Loaded with crunchy bell peppers, onions, tomatoes and 100% mozzarella cheese",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
        portionType: "size",
        portions: {
          small: {
            sellingPrice: 199,
            mrp: 249,
            b2bPrice: 160
          },
          medium: {
            sellingPrice: 349,
            mrp: 419,
            b2bPrice: 280
          },
          large: {
            sellingPrice: 499,
            mrp: 599,
            b2bPrice: 390
          }
        },
        addOns: [
          { name: "Cheese Burst Crust", price: 79 },
          { name: "Spicy Peri-Peri Dip", price: 25 }
        ]
      },
      {
        name: "Hyderabadi Chicken Biryani",
        price: 280,
        mrp: 340,
        b2bPrice: 230,
        category: "Biryani",
        foodType: "non-veg",
        description: "Authentic slow-cooked dum biryani served with raita and mirchi ka salan",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
        portionType: "half_full",
        portions: {
          half: {
            sellingPrice: 160,
            mrp: 190,
            b2bPrice: 130
          },
          full: {
            sellingPrice: 280,
            mrp: 340,
            b2bPrice: 230
          }
        },
        addOns: [
          { name: "Extra Raita", price: 25 },
          { name: "Boiled Egg (2 pcs)", price: 30 }
        ]
      },
      {
        name: "Cold Coffee Shake",
        price: 120,
        mrp: 150,
        b2bPrice: 90,
        category: "Beverages",
        foodType: "veg",
        description: "Chilled thick blended coffee with vanilla ice cream",
        image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80",
        portionType: "size",
        portions: {
          small: {
            sellingPrice: 120,
            mrp: 150,
            b2bPrice: 90
          },
          medium: {
            sellingPrice: 160,
            mrp: 199,
            b2bPrice: 125
          },
          large: {
            sellingPrice: 210,
            mrp: 260,
            b2bPrice: 165
          }
        },
        addOns: [
          { name: "Extra Choco Chip Scoop", price: 30 }
        ]
      }
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ECDKART_Dynamic_Menu_Template.json";
    a.click();
  };

  // Open Add Item Modal
  const openAddModal = () => {
    setEditingItem(null);
    setItemName("");
    setItemCategory(availableCategories.length > 0 ? availableCategories[0] : "Main Course");
    setItemFoodType("veg");
    setItemSellingPrice("");
    setItemMrp("");
    setItemB2bPrice("");
    setItemDescription("");
    setItemImage("");
    setItemOos(false);
    setItemPreparationTime("15");

    // Reset portions & add-ons
    setItemPortionType("none");
    setHalfSellingPrice("");
    setHalfMrp("");
    setHalfB2bPrice("");
    setFullSellingPrice("");
    setFullMrp("");
    setFullB2bPrice("");
    setSmallSellingPrice("");
    setSmallMrp("");
    setSmallB2bPrice("");
    setMedSellingPrice("");
    setMedMrp("");
    setMedB2bPrice("");
    setLargeSellingPrice("");
    setLargeMrp("");
    setLargeB2bPrice("");
    setItemAddOns([]);

    setAddModalOpen(true);
  };

  // Open Edit Item Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.name?.en || item.name || "");
    setItemCategory(getCategoryString(item));
    setItemFoodType(item.foodType || (item.isVeg !== false ? "veg" : "non-veg"));
    setItemSellingPrice(item.sellingPrice || item.basePrice || "");
    setItemMrp(item.mrp || item.sellingPrice || "");
    setItemB2bPrice(item.b2bPrice || item.b2bSellingPrice || item.sellingPrice || "");
    setItemDescription(item.description?.en || item.description || "");
    setItemImage(item.image || "");
    setItemOos(!item.available);
    setItemPreparationTime(item.preparationTime || "15");

    // Extract portions & portionType
    const pType = item.portionType || (item.portions?.half?.sellingPrice || item.portions?.full?.sellingPrice ? "half_full" : (item.portions?.small?.sellingPrice || item.portions?.medium?.sellingPrice || item.portions?.large?.sellingPrice ? "size" : "none"));
    setItemPortionType(pType);

    const portions = item.portions || {};
    setHalfSellingPrice(portions.half?.sellingPrice ?? "");
    setHalfMrp(portions.half?.mrp ?? "");
    setHalfB2bPrice(portions.half?.b2bPrice ?? "");

    setFullSellingPrice(portions.full?.sellingPrice ?? "");
    setFullMrp(portions.full?.mrp ?? "");
    setFullB2bPrice(portions.full?.b2bPrice ?? "");

    setSmallSellingPrice(portions.small?.sellingPrice ?? "");
    setSmallMrp(portions.small?.mrp ?? "");
    setSmallB2bPrice(portions.small?.b2bPrice ?? "");

    setMedSellingPrice(portions.medium?.sellingPrice ?? "");
    setMedMrp(portions.medium?.mrp ?? "");
    setMedB2bPrice(portions.medium?.b2bPrice ?? "");

    setLargeSellingPrice(portions.large?.sellingPrice ?? "");
    setLargeMrp(portions.large?.mrp ?? "");
    setLargeB2bPrice(portions.large?.b2bPrice ?? "");

    // AddOns
    const rawAddOns = item.addOns || item.addons || [];
    setItemAddOns(
      Array.isArray(rawAddOns)
        ? rawAddOns.map((ao) => ({
            name: typeof ao === "string" ? ao : (ao.name?.en || ao.name || ""),
            price: typeof ao === "object" && ao.price !== undefined ? Number(ao.price) : 0,
          }))
        : []
    );

    setAddModalOpen(true);
  };

  // Save / Update Menu Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error("Please provide Dish Name");
      return;
    }
    if (!itemImage || !itemImage.trim()) {
      toast.error("Dish Photo is mandatory! Please upload or enter a photo.");
      return;
    }

    // Portion validation
    let baseSelling = 0;
    let baseMrpVal = 0;
    let baseB2bVal = 0;
    const portions = {};

    if (itemPortionType === "half_full") {
      if (!fullSellingPrice && !halfSellingPrice) {
        toast.error("Please provide selling price for at least Full or Half plate");
        return;
      }
      if (fullSellingPrice) {
        portions.full = {
          sellingPrice: Number(fullSellingPrice),
          mrp: Number(fullMrp || fullSellingPrice),
          b2bPrice: Number(fullB2bPrice || fullSellingPrice),
        };
      }
      if (halfSellingPrice) {
        portions.half = {
          sellingPrice: Number(halfSellingPrice),
          mrp: Number(halfMrp || halfSellingPrice),
          b2bPrice: Number(halfB2bPrice || halfSellingPrice),
        };
      }
      baseSelling = portions.full?.sellingPrice || portions.half?.sellingPrice || 0;
      baseMrpVal = portions.full?.mrp || portions.half?.mrp || baseSelling;
      baseB2bVal = portions.full?.b2bPrice || portions.half?.b2bPrice || baseSelling;
    } else if (itemPortionType === "size") {
      if (!smallSellingPrice && !medSellingPrice && !largeSellingPrice) {
        toast.error("Please provide selling price for at least one size (Small, Medium, or Large)");
        return;
      }
      if (smallSellingPrice) {
        portions.small = {
          sellingPrice: Number(smallSellingPrice),
          mrp: Number(smallMrp || smallSellingPrice),
          b2bPrice: Number(smallB2bPrice || smallSellingPrice),
        };
      }
      if (medSellingPrice) {
        portions.medium = {
          sellingPrice: Number(medSellingPrice),
          mrp: Number(medMrp || medSellingPrice),
          b2bPrice: Number(medB2bPrice || medSellingPrice),
        };
      }
      if (largeSellingPrice) {
        portions.large = {
          sellingPrice: Number(largeSellingPrice),
          mrp: Number(largeMrp || largeSellingPrice),
          b2bPrice: Number(largeB2bPrice || largeSellingPrice),
        };
      }
      baseSelling = portions.small?.sellingPrice || portions.medium?.sellingPrice || portions.large?.sellingPrice || 0;
      baseMrpVal = portions.small?.mrp || portions.medium?.mrp || portions.large?.mrp || baseSelling;
      baseB2bVal = portions.small?.b2bPrice || portions.medium?.b2bPrice || portions.large?.b2bPrice || baseSelling;
    } else {
      if (!itemSellingPrice) {
        toast.error("Please provide Selling Price");
        return;
      }
      baseSelling = Number(itemSellingPrice);
      baseMrpVal = Number(itemMrp || itemSellingPrice);
      baseB2bVal = Number(itemB2bPrice || itemSellingPrice);
    }

    const validAddOns = itemAddOns
      .filter((ao) => ao.name && ao.name.trim())
      .map((ao) => ({
        name: ao.name.trim(),
        price: Number(ao.price) || 0,
      }));

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        name: itemName.trim(),
        description: itemDescription.trim(),
        category: itemCategory,
        sellingPrice: baseSelling,
        basePrice: baseSelling,
        mrp: baseMrpVal,
        b2cSellingPrice: baseSelling,
        b2cMrp: baseMrpVal,
        b2bSellingPrice: baseB2bVal,
        b2bPrice: baseB2bVal,
        foodType: itemFoodType,
        isVeg: itemFoodType === "veg",
        available: !itemOos,
        preparationTime: Number(itemPreparationTime || 15),
        image: itemImage,
        portionType: itemPortionType,
        portions: Object.keys(portions).length > 0 ? portions : null,
        addOns: validAddOns,
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

        const parseCSVLine = (line) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result.map((c) => c.replace(/^["']|["']$/g, "").trim());
        };

        if (bulkFile.name.endsWith(".json")) {
          const rawItems = JSON.parse(text);
          items = (Array.isArray(rawItems) ? rawItems : []).map((it, i) => {
            const imgVal = it.image || it.imageUrl || it.image_url || it.photo || it.photoUrl || it.dishPhoto || it["image url"] || it.picture || it.img || it.url || it.link || "";
            const baseP = Number(it.basePrice ?? it["base price"] ?? it.base_price ?? it.baseprice ?? it.price ?? it.sellingPrice ?? (it.portions?.full?.basePrice || it.portions?.full?.sellingPrice || it.portions?.small?.sellingPrice) ?? 0);
            const sellP = Number(it.sellingPrice ?? it["selling price"] ?? it.selling_price ?? it.price ?? baseP);
            const mrpP = Number(it.mrp ?? it.b2cMrp ?? it["b2c mrp"] ?? Math.max(sellP, baseP));
            const b2bP = Number(it.b2bPrice ?? it["b2b price"] ?? it.b2bSellingPrice ?? baseP);
            return {
              name: it.name || it["item name"] || it["dish name"] || it.dishName || it.itemName || `Item ${i + 1}`,
              basePrice: baseP,
              price: baseP,
              sellingPrice: sellP,
              mrp: mrpP,
              b2bPrice: b2bP,
              category: it.category || "Main Course",
              foodType: it.foodType || it.foodtype || "veg",
              description: it.description || "",
              image: imgVal,
              portionType: it.portionType || (it.portions ? (it.portions.half || it.portions.full ? "half_full" : "size") : "none"),
              portions: it.portions || null,
              variations: it.variations || [],
              addOns: it.addOns || it.addons || [],
              halfSellingPrice: it.halfSellingPrice || it.halfPrice || it.half_price || null,
              halfMrp: it.halfMrp || null,
              halfB2bPrice: it.halfB2bPrice || null,
              fullSellingPrice: it.fullSellingPrice || it.fullPrice || it.full_price || null,
              fullMrp: it.fullMrp || null,
              fullB2bPrice: it.fullB2bPrice || null,
              smallSellingPrice: it.smallSellingPrice || it.smallPrice || null,
              smallMrp: it.smallMrp || null,
              smallB2bPrice: it.smallB2bPrice || null,
              medSellingPrice: it.medSellingPrice || it.mediumSellingPrice || it.medPrice || null,
              medMrp: it.medMrp || it.mediumMrp || null,
              medB2bPrice: it.medB2bPrice || it.mediumB2bPrice || null,
              largeSellingPrice: it.largeSellingPrice || it.largePrice || null,
              largeMrp: it.largeMrp || null,
              largeB2bPrice: it.largeB2bPrice || null,
            };
          });
        } else {
          // Parse CSV
          const lines = text.split("\n").filter((l) => l.trim());
          const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length >= 2) {
              const item = {};
              headers.forEach((h, idx) => {
                const cleanKey = h.trim().toLowerCase();
                const noSpaceKey = cleanKey.replace(/[\s_-]+/g, "");
                item[cleanKey] = cols[idx] || "";
                item[noSpaceKey] = cols[idx] || "";
              });
              const imgVal = item.image || item["image url"] || item["image_url"] || item.imageurl || item.imageUrl || item.photo || item["photo url"] || item.photo_url || item.dishphoto || item["dish photo"] || item.dish_photo || item.picture || item.img || item.url || item.link || "";
              const baseP = Number(item["base price"] || item.baseprice || item.base_price || item.basePrice || item.price || item.sellingprice || item["selling price"] || item.full_price || item.half_price || 0);
              const sellP = Number(item["selling price"] || item.sellingprice || item.selling_price || item.sellingPrice || item.price || baseP);
              const mrpP = Number(item.mrp || item["b2c mrp"] || item.b2cmrp || item.b2c_mrp || Math.max(sellP, baseP));
              const b2bP = Number(item["b2b price"] || item.b2bprice || item.b2b_price || item["b2b selling price"] || item.b2bsellingprice || baseP);

              items.push({
                name: item.name || item["item name"] || item.itemname || item["dish name"] || item.dishname || `Item ${i}`,
                basePrice: baseP,
                price: baseP,
                sellingPrice: sellP,
                mrp: mrpP,
                b2bPrice: b2bP,
                category: item.category || item["category name"] || item.categoryname || "Main Course",
                foodType: item.foodtype || item["food type"] || "veg",
                description: item.description || item.desc || "",
                image: imgVal,
                preparationTime: Number(item.preptime || item["prep time"] || item.preparationtime || 15),
                portionType: item.portiontype || (item.half_price || item.full_price ? "half_full" : item.small_price || item.med_price ? "size" : "none"),
                halfSellingPrice: item.half_price || item.halfprice || null,
                halfMrp: item.half_mrp || null,
                halfB2bPrice: item.half_b2b || null,
                fullSellingPrice: item.full_price || item.fullprice || null,
                fullMrp: item.full_mrp || null,
                fullB2bPrice: item.full_b2b || null,
                smallSellingPrice: item.small_price || null,
                smallMrp: item.small_mrp || null,
                smallB2bPrice: item.small_b2b || null,
                medSellingPrice: item.med_price || item.medium_price || null,
                medMrp: item.med_mrp || null,
                medB2bPrice: item.med_b2b || null,
                largeSellingPrice: item.large_price || null,
                largeMrp: item.large_mrp || null,
                largeB2bPrice: item.large_b2b || null,
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

  // Helper to extract clean category string from any format
  const getCategoryString = (item) => {
    const cat = item.category || item.categoryId;
    if (!cat) return "Main Course";
    if (typeof cat === "string") return cat;
    if (typeof cat.name === "string") return cat.name;
    if (cat.name && typeof cat.name === "object") return cat.name.en || Object.values(cat.name)[0] || "Main Course";
    if (typeof cat.slug === "string") return cat.slug;
    return "Main Course";
  };

  // Dynamically extract all available categories present in the menu & system
  const availableCategories = useMemo(() => {
    const catMap = new Map();

    // 1. System categories from database
    systemCategories.forEach((sc) => {
      if (sc && typeof sc === "string" && sc.trim()) {
        const trimmed = sc.trim();
        catMap.set(trimmed.toLowerCase(), trimmed);
      }
    });

    // 2. Menu categories
    menu.forEach((item) => {
      const catName = getCategoryString(item);
      if (catName && catName.trim()) {
        const trimmed = catName.trim();
        const key = trimmed.toLowerCase();
        if (!catMap.has(key)) {
          catMap.set(key, trimmed);
        }
      }
    });

    // 3. Standard preset categories
    const defaults = ["Main Course", "Starters & Snacks", "Breads & Rice", "Beverages & Shakes", "Desserts", "Momos", "Fast Food", "Chinese", "Biryani"];
    defaults.forEach((d) => {
      if (!catMap.has(d.toLowerCase())) {
        catMap.set(d.toLowerCase(), d);
      }
    });

    return Array.from(catMap.values());
  }, [menu, systemCategories]);

  // Filtered Menu Items
  const filteredMenu = menu.filter((item) => {
    const nameStr = (item.name?.en || item.name || "").toLowerCase();
    const itemCat = getCategoryString(item).trim().toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(query) || itemCat.includes(query);
    const filterCat = categoryFilter.trim().toLowerCase();
    const matchesCategory =
      filterCat === "all" ||
      itemCat === filterCat ||
      itemCat.replace(/[^a-z0-9]/g, "") === filterCat.replace(/[^a-z0-9]/g, "") ||
      itemCat.includes(filterCat) ||
      filterCat.includes(itemCat);

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
            onClick={handleDownloadMenuTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
            title="Download Sample Menu Template (.json)"
          >
            <Download size={15} />
            Template
          </button>

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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories ({menu.length})</option>
            {availableCategories.map((cat) => {
              const count = menu.filter((i) => {
                const c = getCategoryString(i).trim().toLowerCase();
                const target = cat.trim().toLowerCase();
                return c === target || c.replace(/[^a-z0-9]/g, "") === target.replace(/[^a-z0-9]/g, "");
              }).length;
              return (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
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
                const hasHalfFull = item.portionType === "half_full" || Boolean(item.portions?.half?.sellingPrice || item.portions?.full?.sellingPrice);
                const hasSizes = item.portionType === "size" || Boolean(item.portions?.small?.sellingPrice || item.portions?.medium?.sellingPrice || item.portions?.large?.sellingPrice);
                const addOnsList = item.addOns || item.addons || [];

                return (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    {/* Dish Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name?.en || item.name || "Dish"}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">
                            {((item.name?.en || item.name) || "D").charAt(0).toUpperCase()}
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
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {hasHalfFull && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                Half / Full
                              </span>
                            )}
                            {hasSizes && (
                              <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                S / M / L
                              </span>
                            )}
                            {addOnsList.length > 0 && (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                +{addOnsList.length} Add-ons
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {getCategoryString(item)}
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
                    <td className="py-3.5 px-4">
                      {hasHalfFull ? (
                        <div className="space-y-1">
                          {item.portions?.full?.sellingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">Full</span>
                              <span className="font-black text-slate-900 text-xs">₹{item.portions.full.sellingPrice}</span>
                            </div>
                          ) : null}
                          {item.portions?.half?.sellingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">Half</span>
                              <span className="font-black text-slate-900 text-xs">₹{item.portions.half.sellingPrice}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : hasSizes ? (
                        <div className="space-y-1">
                          {item.portions?.small?.sellingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">S</span>
                              <span className="font-black text-slate-900 text-xs">₹{item.portions.small.sellingPrice}</span>
                            </div>
                          ) : null}
                          {item.portions?.medium?.sellingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">M</span>
                              <span className="font-black text-slate-900 text-xs">₹{item.portions.medium.sellingPrice}</span>
                            </div>
                          ) : null}
                          {item.portions?.large?.sellingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">L</span>
                              <span className="font-black text-slate-900 text-xs">₹{item.portions.large.sellingPrice}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="font-black text-slate-900 text-sm">
                          ₹{Number(sellingPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>

                    {/* MRP / B2B */}
                    <td className="py-3.5 px-4">
                      {hasHalfFull ? (
                        <div className="space-y-1 text-[11px]">
                          {item.portions?.full?.sellingPrice ? (
                            <div>
                              <span className="text-slate-400 font-medium">Full: </span>
                              {item.portions.full.mrp > item.portions.full.sellingPrice && (
                                <span className="line-through text-slate-400 mr-1">₹{item.portions.full.mrp}</span>
                              )}
                              <span className="text-blue-700 font-bold">B2B: ₹{item.portions.full.b2bPrice ?? item.portions.full.sellingPrice}</span>
                            </div>
                          ) : null}
                          {item.portions?.half?.sellingPrice ? (
                            <div>
                              <span className="text-slate-400 font-medium">Half: </span>
                              {item.portions.half.mrp > item.portions.half.sellingPrice && (
                                <span className="line-through text-slate-400 mr-1">₹{item.portions.half.mrp}</span>
                              )}
                              <span className="text-blue-700 font-bold">B2B: ₹{item.portions.half.b2bPrice ?? item.portions.half.sellingPrice}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : hasSizes ? (
                        <div className="space-y-1 text-[11px]">
                          {item.portions?.small?.sellingPrice ? (
                            <div>
                              <span className="text-slate-400 font-medium">S: </span>
                              {item.portions.small.mrp > item.portions.small.sellingPrice && (
                                <span className="line-through text-slate-400 mr-1">₹{item.portions.small.mrp}</span>
                              )}
                              <span className="text-blue-700 font-bold">B2B: ₹{item.portions.small.b2bPrice ?? item.portions.small.sellingPrice}</span>
                            </div>
                          ) : null}
                          {item.portions?.medium?.sellingPrice ? (
                            <div>
                              <span className="text-slate-400 font-medium">M: </span>
                              {item.portions.medium.mrp > item.portions.medium.sellingPrice && (
                                <span className="line-through text-slate-400 mr-1">₹{item.portions.medium.mrp}</span>
                              )}
                              <span className="text-blue-700 font-bold">B2B: ₹{item.portions.medium.b2bPrice ?? item.portions.medium.sellingPrice}</span>
                            </div>
                          ) : null}
                          {item.portions?.large?.sellingPrice ? (
                            <div>
                              <span className="text-slate-400 font-medium">L: </span>
                              {item.portions.large.mrp > item.portions.large.sellingPrice && (
                                <span className="line-through text-slate-400 mr-1">₹{item.portions.large.mrp}</span>
                              )}
                              <span className="text-blue-700 font-bold">B2B: ₹{item.portions.large.b2bPrice ?? item.portions.large.sellingPrice}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
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
                      )}
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
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #F1F5F9", pb: 2 }}>
          {editingItem ? "Edit Food Item & Portions" : "Add New Food Item & Portions"}
        </DialogTitle>
        <form onSubmit={handleSaveItem}>
          <DialogContent className="space-y-4 pt-4">
            <TextField
              label="Dish Name *"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              required
              size="small"
              placeholder="e.g. Paneer Butter Masala, Chicken Dum Biryani, Cheesy Pizza"
            />

            <div className="grid grid-cols-2 gap-3">
              <Autocomplete
                freeSolo
                options={availableCategories}
                value={itemCategory}
                onChange={(event, newValue) => {
                  setItemCategory(newValue || "");
                }}
                onInputChange={(event, newInputValue) => {
                  setItemCategory(newInputValue || "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category *"
                    size="small"
                    placeholder="Select or enter category..."
                    required
                  />
                )}
              />

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

            {/* PORTION / SIZING SELECTOR */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Portion & Sizing Configuration
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Choose if this dish has Half/Full plates, Small/Med/Large sizes, or standard single price.
                  </p>
                </div>
              </div>

              {/* Segmented Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setItemPortionType("none")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    itemPortionType === "none"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Standard (Single Price)
                </button>
                <button
                  type="button"
                  onClick={() => setItemPortionType("half_full")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    itemPortionType === "half_full"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Half & Full Plate
                </button>
                <button
                  type="button"
                  onClick={() => setItemPortionType("size")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    itemPortionType === "size"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Small / Med / Large
                </button>
              </div>

              {/* STANDARD SINGLE PRICE INPUTS */}
              {itemPortionType === "none" && (
                <div className="grid grid-cols-3 gap-3 pt-2">
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
              )}

              {/* HALF & FULL PLATE INPUTS */}
              {itemPortionType === "half_full" && (
                <div className="space-y-2.5 pt-1">
                  {/* Full Plate */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase">
                      Full Plate Pricing
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <TextField
                        label="Full Selling Price (₹) *"
                        type="number"
                        value={fullSellingPrice}
                        onChange={(e) => setFullSellingPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="280"
                      />
                      <TextField
                        label="Full MRP (₹)"
                        type="number"
                        value={fullMrp}
                        onChange={(e) => setFullMrp(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="340"
                      />
                      <TextField
                        label="Full B2B Price (₹)"
                        type="number"
                        value={fullB2bPrice}
                        onChange={(e) => setFullB2bPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="230"
                      />
                    </div>
                  </div>

                  {/* Half Plate */}
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[11px] font-extrabold text-amber-800 block mb-1.5 uppercase">
                      Half Plate Pricing (Optional if only Full)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <TextField
                        label="Half Selling Price (₹)"
                        type="number"
                        value={halfSellingPrice}
                        onChange={(e) => setHalfSellingPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="160"
                      />
                      <TextField
                        label="Half MRP (₹)"
                        type="number"
                        value={halfMrp}
                        onChange={(e) => setHalfMrp(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="190"
                      />
                      <TextField
                        label="Half B2B Price (₹)"
                        type="number"
                        value={halfB2bPrice}
                        onChange={(e) => setHalfB2bPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="130"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* S / M / L SIZES INPUTS */}
              {itemPortionType === "size" && (
                <div className="space-y-2.5 pt-1">
                  {/* Small */}
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-700 block mb-1 uppercase">
                      Small (S) Size Pricing
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <TextField
                        label="Small Selling Price (₹)"
                        type="number"
                        value={smallSellingPrice}
                        onChange={(e) => setSmallSellingPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="199"
                      />
                      <TextField
                        label="Small MRP (₹)"
                        type="number"
                        value={smallMrp}
                        onChange={(e) => setSmallMrp(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="249"
                      />
                      <TextField
                        label="Small B2B (₹)"
                        type="number"
                        value={smallB2bPrice}
                        onChange={(e) => setSmallB2bPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="160"
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="p-2 bg-white rounded-xl border border-purple-200">
                    <span className="text-[11px] font-extrabold text-purple-800 block mb-1 uppercase">
                      Medium (M) Size Pricing
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <TextField
                        label="Medium Selling Price (₹)"
                        type="number"
                        value={medSellingPrice}
                        onChange={(e) => setMedSellingPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="349"
                      />
                      <TextField
                        label="Medium MRP (₹)"
                        type="number"
                        value={medMrp}
                        onChange={(e) => setMedMrp(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="419"
                      />
                      <TextField
                        label="Medium B2B (₹)"
                        type="number"
                        value={medB2bPrice}
                        onChange={(e) => setMedB2bPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="280"
                      />
                    </div>
                  </div>

                  {/* Large */}
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-700 block mb-1 uppercase">
                      Large (L) Size Pricing
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <TextField
                        label="Large Selling Price (₹)"
                        type="number"
                        value={largeSellingPrice}
                        onChange={(e) => setLargeSellingPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="499"
                      />
                      <TextField
                        label="Large MRP (₹)"
                        type="number"
                        value={largeMrp}
                        onChange={(e) => setLargeMrp(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="599"
                      />
                      <TextField
                        label="Large B2B (₹)"
                        type="number"
                        value={largeB2bPrice}
                        onChange={(e) => setLargeB2bPrice(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="390"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC ADD-ONS / FLAVORS MANAGER */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Dish Add-ons / Flavors (Optional)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    E.g. Extra Butter, Extra Cheese, Spicy Mayo Dip, Extra Paneer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setItemAddOns((prev) => [...prev, { name: "", price: "" }])}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                >
                  <Plus size={14} />
                  Add Add-on
                </button>
              </div>

              {itemAddOns.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">No add-ons added for this dish.</p>
              ) : (
                <div className="space-y-2">
                  {itemAddOns.map((ao, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <TextField
                        label={`Add-on #${idx + 1} Name`}
                        size="small"
                        value={ao.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemAddOns((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                        }}
                        placeholder="e.g. Extra Cheese"
                        className="flex-1"
                      />
                      <TextField
                        label="Price (₹)"
                        type="number"
                        size="small"
                        value={ao.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemAddOns((prev) => prev.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                        }}
                        placeholder="30"
                        sx={{ width: 120 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setItemAddOns((prev) => prev.filter((_, i) => i !== idx))}
                        sx={{ color: "#EF4444" }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
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
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid #F1F5F9" }}>
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
      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk Menu Upload (JSON / CSV)</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload a JSON or CSV file containing complete restaurant menu items with portions (Half/Full plate, Small/Medium/Large sizes) and dynamic Add-ons.
          </p>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-blue-900">Need the standard JSON format?</p>
              <p className="text-[11px] text-blue-700">Download our sample template with portions and add-ons pre-configured.</p>
            </div>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDownloadMenuTemplate}
              startIcon={<Download size={14} />}
              sx={{ textTransform: "none", fontWeight: 700, borderColor: "#2563EB", color: "#2563EB", flexShrink: 0 }}
            >
              Template
            </Button>
          </div>

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

