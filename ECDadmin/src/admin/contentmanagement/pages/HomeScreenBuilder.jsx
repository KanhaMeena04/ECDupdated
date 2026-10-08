import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../utils/utils";
import toast from "react-hot-toast";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layout,
  ExternalLink,
  Utensils,
  Save,
  Image as ImageIcon,
  Check,
} from "lucide-react";

const SECTION_TYPE_LABELS = {
  banner_carousel: "Banner Carousel",
  category_grid: "Food Categories Grid",
  comparison_banner: "ECDkart Price Comparison Banner",
  recommended_dishes: "Recommended Dishes Row",
  restaurant_list: "Explore Restaurants List",
  promotional_card: "Promotional Card",
  custom_banner: "Custom Banner",
};

const HomeScreenBuilder = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [modalTab, setModalTab] = useState("settings"); // 'settings' | 'categories'

  // Food Categories (What's on your mind?) Management State
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatPrice, setNewCatPrice] = useState(49);
  const [savingCatId, setSavingCatId] = useState(null);

  const [formData, setFormData] = useState({
    sectionKey: "",
    title: "",
    subtitle: "",
    sectionType: "restaurant_list",
    imageUrl: "",
    ctaText: "",
    ctaAction: "none",
    ctaTarget: "",
    priority: 10,
    isActive: true,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("image", file);

    try {
      setUploadingImage(true);
      const headers = getAuthHeaders();
      const res = await axios.post(`${API_BASE_URL}/api/upload`, uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...headers,
        },
        withCredentials: true,
      });

      const uploadedUrl = res.data?.url || res.data?.imageUrl || res.data?.secure_url || res.data?.data?.url;
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload succeeded but no URL returned. Enter URL manually.");
      }
    } catch (err) {
      console.warn("Upload fallback error:", err);
      toast.error("Could not upload file directly. You can paste the Image URL.");
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/home/admin/home-sections`, {
        headers,
        withCredentials: true,
      });
      if (res.data.success) {
        setSections(res.data.sections);
      }
    } catch (err) {
      console.error("Error fetching home sections:", err);
      toast.error(err.response?.data?.message || "Failed to load home sections");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Category Items (What's on your mind? items)
  const fetchCategoriesList = async () => {
    try {
      setLoadingCategories(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/categories?type=main`, {
          headers,
          withCredentials: true,
        });
      } catch {
        res = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers,
          withCredentials: true,
        });
      }
      const cats = res.data?.categories || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      // Map to editable form state
      setCategoriesList(
        cats.map((c) => ({
          ...c,
          editName: c.name || "",
          editImage: c.image || "",
          editPrice: c.startingPrice !== undefined && c.startingPrice !== null ? c.startingPrice : 28,
          isSaving: false,
        }))
      );
    } catch (err) {
      console.error("Failed to load categories:", err);
      toast.error("Could not load categories list");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSection(null);
    setModalTab("settings");
    setFormData({
      sectionKey: `section_${Date.now()}`,
      title: "",
      subtitle: "",
      sectionType: "restaurant_list",
      imageUrl: "",
      ctaText: "",
      ctaAction: "none",
      ctaTarget: "",
      priority: (sections.length + 1) * 10,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (sec, initialTab = "settings") => {
    setEditingSection(sec);
    setModalTab(initialTab);
    setFormData({
      sectionKey: sec.sectionKey || "",
      title: sec.title || "",
      subtitle: sec.subtitle || "",
      sectionType: sec.sectionType || "restaurant_list",
      imageUrl: sec.imageUrl || "",
      ctaText: sec.ctaText || "",
      ctaAction: sec.ctaAction || "none",
      ctaTarget: sec.ctaTarget || "",
      priority: sec.priority || 10,
      isActive: sec.isActive !== false,
    });
    setShowModal(true);

    if (sec.sectionKey === "food_categories" || sec.sectionType === "category_grid") {
      fetchCategoriesList();
    }
  };

  const handleToggle = async (id) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        `${API_BASE_URL}/api/home/admin/home-sections/${id}/toggle`,
        {},
        { headers, withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSections();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this home section?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.delete(`${API_BASE_URL}/api/home/admin/home-sections/${id}`, {
        headers,
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Section deleted");
        fetchSections();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete section");
    }
  };

  const handleMove = async (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const itemsToUpdate = newSections.map((sec, idx) => ({
      id: sec._id,
      priority: (idx + 1) * 10,
    }));

    setSections(newSections);

    try {
      const headers = getAuthHeaders();
      await axios.put(
        `${API_BASE_URL}/api/home/admin/home-sections/reorder`,
        { items: itemsToUpdate },
        { headers, withCredentials: true }
      );
      toast.success("Sections reordered");
    } catch (err) {
      toast.error("Failed to persist order");
      fetchSections();
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      if (editingSection) {
        const res = await axios.put(
          `${API_BASE_URL}/api/home/admin/home-sections/${editingSection._id}`,
          formData,
          { headers, withCredentials: true }
        );
        if (res.data.success) {
          toast.success("Section updated successfully");
          setShowModal(false);
          fetchSections();
        }
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/home/admin/home-sections`,
          formData,
          { headers, withCredentials: true }
        );
        if (res.data.success) {
          toast.success("New section added successfully");
          setShowModal(false);
          fetchSections();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  // Update a single category's name, price, or image
  const handleSaveSingleCategory = async (cat) => {
    try {
      setSavingCatId(cat._id);
      const headers = getAuthHeaders();
      const payload = {
        name: cat.editName?.trim() || cat.name,
        image: cat.editImage?.trim() || cat.image,
        startingPrice: Number(cat.editPrice !== undefined ? cat.editPrice : 49),
      };

      await axios.put(`${API_BASE_URL}/api/categories/${cat._id}`, payload, {
        headers,
        withCredentials: true,
      });

      toast.success(`Updated "${payload.name}" price to ₹${payload.startingPrice}!`);
      fetchCategoriesList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
    } finally {
      setSavingCatId(null);
    }
  };

  // Bulk save all modified category prices
  const handleSaveAllCategoryPrices = async () => {
    try {
      setSavingCatId("all");
      const headers = getAuthHeaders();
      const promises = categoriesList.map((cat) =>
        axios.put(
          `${API_BASE_URL}/api/categories/${cat._id}`,
          {
            name: cat.editName?.trim() || cat.name,
            image: cat.editImage?.trim() || cat.image,
            startingPrice: Number(cat.editPrice !== undefined ? cat.editPrice : 49),
          },
          { headers, withCredentials: true }
        )
      );
      await Promise.all(promises);
      toast.success("All dish prices updated successfully!");
      fetchCategoriesList();
    } catch (err) {
      toast.error("Failed to save some category prices");
    } finally {
      setSavingCatId(null);
    }
  };

  // Add a new food dish category
  const handleAddNewCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Please enter Category / Dish Name");
      return;
    }
    try {
      const headers = getAuthHeaders();
      const payload = {
        name: newCatName.trim(),
        image: newCatImage.trim() || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
        startingPrice: Number(newCatPrice || 49),
        type: "main",
        isActive: true,
      };

      await axios.post(`${API_BASE_URL}/api/categories`, payload, {
        headers,
        withCredentials: true,
      });

      toast.success(`Added new dish category: "${newCatName}"!`);
      setNewCatName("");
      setNewCatImage("");
      setNewCatPrice(49);
      fetchCategoriesList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add category");
    }
  };

  // Delete a category dish
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete "${catName}"?`)) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/api/categories/${catId}`, {
        headers,
        withCredentials: true,
      });
      toast.success(`Deleted "${catName}"`);
      fetchCategoriesList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const isCategorySection =
    formData.sectionKey === "food_categories" ||
    formData.sectionType === "category_grid" ||
    editingSection?.sectionKey === "food_categories" ||
    editingSection?.sectionType === "category_grid";

  // Clean, crisp input class that guarantees no blackout background
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium bg-white text-gray-900 placeholder-gray-400 focus:bg-white focus:text-gray-900 focus:ring-2 focus:ring-[#248C70] focus:border-[#248C70] focus:outline-none disabled:bg-gray-100 disabled:text-gray-500";

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#173F35] to-[#248C70] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
            <Layout className="w-3.5 h-3.5" /> Dynamic Layout Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Home Screen Builder</h2>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Configure dynamic sections, banner carousels, dish categories ("What's on your mind?"), and prices shown on the User App in real time.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-white text-[#173F35] px-5 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-gray-100 transition flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <Plus className="w-5 h-5 text-[#248C70]" />
          Add Home Section
        </button>
      </div>

      {/* Sections Table / Cards List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#248C70] border-t-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-gray-500">Loading home layout configuration...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Home Sections Configured</h3>
          <p className="text-sm text-gray-500 mt-1">Click below to create your first dynamic home section.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 bg-[#248C70] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#1f7860] transition"
          >
            Create Section
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((sec, index) => {
            const isCatGrid = sec.sectionKey === "food_categories" || sec.sectionType === "category_grid";
            return (
              <div
                key={sec._id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition shadow-sm hover:shadow-md ${
                  sec.isActive ? "border-gray-200" : "border-red-200 bg-red-50/20"
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex flex-col items-center justify-center bg-gray-100 text-gray-700 font-black rounded-xl w-10 h-10 text-sm">
                    #{index + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900">{sec.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#248C70]/10 text-[#248C70]">
                        {SECTION_TYPE_LABELS[sec.sectionType] || sec.sectionType}
                      </span>
                      {sec.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    {sec.subtitle && (
                      <p className="text-xs text-gray-500 font-medium">{sec.subtitle}</p>
                    )}
                    <div className="text-[11px] text-gray-400 font-mono">
                      Key: {sec.sectionKey} | Priority: {sec.priority}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  {/* Category Grid Quick Manager Button */}
                  {isCatGrid && (
                    <button
                      onClick={() => handleOpenEditModal(sec, "categories")}
                      className="px-3 py-1.5 bg-[#248C70]/10 hover:bg-[#248C70]/20 text-[#248C70] border border-[#248C70]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      title="Manage What's on your mind? Dishes, Photos & Prices"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Dishes, Prices & Photos
                    </button>
                  )}

                  {/* Reorder Buttons */}
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 disabled:opacity-30 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={index === sections.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 disabled:opacity-30 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Status */}
                  <button
                    onClick={() => handleToggle(sec._id)}
                    className={`p-2 rounded-xl border transition ${
                      sec.isActive
                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={sec.isActive ? "Hide Section" : "Show Section"}
                  >
                    {sec.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModal(sec, "settings")}
                    className="p-2 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 rounded-xl transition"
                    title="Edit Section"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(sec._id)}
                    className="p-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl transition"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div
            className={`bg-white rounded-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isCategorySection ? "max-w-4xl" : "max-w-lg"
            }`}
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#248C70]" />
                {editingSection ? `Edit Section: ${formData.title || formData.sectionKey}` : "Add New Home Section"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher if this is "What's on your mind?" / category_grid */}
            {isCategorySection && (
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                  type="button"
                  onClick={() => setModalTab("settings")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    modalTab === "settings"
                      ? "bg-[#248C70] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  Section Settings & Title
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab("categories");
                    fetchCategoriesList();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    modalTab === "categories"
                      ? "bg-[#248C70] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  What's on your mind? Dishes, Prices & Photos ({categoriesList.length})
                </button>
              </div>
            )}

            {/* TAB 1: SECTION SETTINGS */}
            {modalTab === "settings" && (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Section Key (Unique)</label>
                  <input
                    type="text"
                    required
                    value={formData.sectionKey}
                    onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                    disabled={!!editingSection}
                    className={inputClass}
                    style={{ backgroundColor: "#ffffff", color: "#111827" }}
                    placeholder="e.g. food_categories"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Heading / Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={inputClass}
                    style={{ backgroundColor: "#ffffff", color: "#111827" }}
                    placeholder="e.g. What's on your mind?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle (Optional)</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className={inputClass}
                    style={{ backgroundColor: "#ffffff", color: "#111827" }}
                    placeholder="e.g. Explore by top food categories"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Section Type</label>
                  <select
                    value={formData.sectionType}
                    onChange={(e) => setFormData({ ...formData, sectionType: e.target.value })}
                    className={inputClass}
                    style={{ backgroundColor: "#ffffff", color: "#111827" }}
                  >
                    <option value="banner_carousel">Banner Carousel</option>
                    <option value="category_grid">Food Categories Grid (What's on your mind?)</option>
                    <option value="comparison_banner">ECDkart Price Comparison Banner</option>
                    <option value="recommended_dishes">Recommended Dishes Row</option>
                    <option value="restaurant_list">Explore Restaurants List</option>
                    <option value="promotional_card">Promotional Card</option>
                    <option value="custom_banner">Custom Banner</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CTA Action</label>
                    <select
                      value={formData.ctaAction}
                      onChange={(e) => setFormData({ ...formData, ctaAction: e.target.value })}
                      className={inputClass}
                      style={{ backgroundColor: "#ffffff", color: "#111827" }}
                    >
                      <option value="none">None</option>
                      <option value="category">Open Category</option>
                      <option value="restaurant">Open Restaurant</option>
                      <option value="product">Open Product/Dish</option>
                      <option value="link">External Link</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className={inputClass}
                      style={{ backgroundColor: "#ffffff", color: "#111827" }}
                      placeholder="e.g. View All"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CTA Target ID / URL</label>
                  <input
                    type="text"
                    value={formData.ctaTarget}
                    onChange={(e) => setFormData({ ...formData, ctaTarget: e.target.value })}
                    className={inputClass}
                    style={{ backgroundColor: "#ffffff", color: "#111827" }}
                    placeholder="e.g. category_id or URL"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Banner Image URL / File (Optional)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className={inputClass}
                      style={{ backgroundColor: "#ffffff", color: "#111827" }}
                      placeholder="https://... or upload file"
                    />
                    <label
                      className={`cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 border rounded-xl text-xs font-bold text-gray-700 whitespace-nowrap transition ${
                        uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {uploadingImage ? "Uploading..." : "Upload File"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={handleImageFileChange}
                      />
                    </label>
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border bg-gray-50">
                      <img src={formData.imageUrl} alt="Section Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#248C70] rounded focus:ring-[#248C70] bg-white border-gray-300"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-bold text-gray-800">
                    Section Active / Visible on User App
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#248C70] hover:bg-[#1f7860] text-white rounded-xl text-sm font-bold shadow-md transition"
                  >
                    {editingSection ? "Save Section Header" : "Create Section"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: "WHAT'S ON YOUR MIND?" DISHES, PRICES & PHOTOS MANAGER */}
            {modalTab === "categories" && isCategorySection && (
              <div className="space-y-4">
                {/* Banner guide */}
                <div className="bg-[#248C70]/10 border border-[#248C70]/30 rounded-2xl p-4 flex items-start gap-3">
                  <Utensils className="w-5 h-5 text-[#248C70] shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-800 space-y-1">
                    <p className="font-bold text-gray-900">
                      Live Catalog Editor: What's on your mind? (Dishes, Photos & Starting Prices)
                    </p>
                    <p className="text-gray-600">
                      Yahan se aap har ek food category/dish ka **Name**, **Photo**, aur **Starting Price (FROM ₹XX)** directly change kar sakte hain. Default ₹28 ki jagah apni marzi ka real price (e.g. Biryani ₹119, Pizza ₹99, Burger ₹49) set karein jo seedha User App me show hoga!
                    </p>
                  </div>
                </div>

                {/* Add New Dish / Category Box */}
                <form
                  onSubmit={handleAddNewCategory}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#248C70]" /> Add New Dish / Category
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Dish Name *</label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Shawarma / Rolls"
                        className={inputClass}
                        style={{ backgroundColor: "#ffffff", color: "#111827" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Starting Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newCatPrice}
                        onChange={(e) => setNewCatPrice(Number(e.target.value))}
                        placeholder="e.g. 59"
                        className={inputClass}
                        style={{ backgroundColor: "#ffffff", color: "#111827" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Image URL (Optional)</label>
                      <input
                        type="text"
                        value={newCatImage}
                        onChange={(e) => setNewCatImage(e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                        style={{ backgroundColor: "#ffffff", color: "#111827" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#248C70] hover:bg-[#1f7860] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Catalog
                    </button>
                  </div>
                </form>

                {/* Categories Table / List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">
                      Current Dishes & Categories ({categoriesList.length} Items)
                    </span>
                    {categoriesList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSaveAllCategoryPrices}
                        disabled={savingCatId === "all"}
                        className="px-3 py-1.5 bg-[#173F35] hover:bg-[#248C70] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingCatId === "all" ? "Saving All..." : "Save All Prices"}
                      </button>
                    )}
                  </div>

                  {loadingCategories ? (
                    <div className="p-8 text-center text-sm font-semibold text-gray-500">
                      Loading categories & prices...
                    </div>
                  ) : categoriesList.length === 0 ? (
                    <div className="p-8 text-center text-sm font-semibold text-gray-500 bg-gray-50 rounded-2xl border">
                      No categories found. Use the form above to add dishes!
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
                      {categoriesList.map((cat, idx) => (
                        <div
                          key={cat._id}
                          className="p-3 sm:p-4 bg-white hover:bg-gray-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative">
                              <img
                                src={cat.editImage || cat.image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                                <input
                                  type="text"
                                  value={cat.editName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCategoriesList((prev) =>
                                      prev.map((c) => (c._id === cat._id ? { ...c, editName: val } : c))
                                    );
                                  }}
                                  className="text-sm font-bold text-gray-900 border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-[#248C70] focus:outline-none bg-transparent w-full"
                                  placeholder="Dish Name"
                                />
                              </div>
                              <input
                                type="text"
                                value={cat.editImage}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCategoriesList((prev) =>
                                    prev.map((c) => (c._id === cat._id ? { ...c, editImage: val } : c))
                                  );
                                }}
                                className="text-[11px] text-gray-500 hover:text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-[#248C70] focus:outline-none bg-transparent w-full truncate mt-0.5"
                                placeholder="Image URL (https://...)"
                              />
                            </div>
                          </div>

                          {/* Right: Starting Price Input & Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1">
                              <span className="text-xs font-black text-emerald-700 mr-1.5">FROM ₹</span>
                              <input
                                type="number"
                                min="1"
                                value={cat.editPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setCategoriesList((prev) =>
                                    prev.map((c) => (c._id === cat._id ? { ...c, editPrice: val } : c))
                                  );
                                }}
                                className="w-16 bg-white text-gray-900 font-bold text-sm text-center border border-gray-300 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#248C70]"
                                style={{ backgroundColor: "#ffffff", color: "#111827" }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveSingleCategory(cat)}
                              disabled={savingCatId === cat._id}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition"
                              title="Save this dish"
                            >
                              {savingCatId === cat._id ? (
                                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent animate-spin rounded-full" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat._id, cat.name)}
                              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition"
                              title="Delete this dish category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setModalTab("settings")}
                    className="text-xs font-bold text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Section Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 bg-[#248C70] hover:bg-[#1f7860] text-white rounded-xl text-sm font-bold shadow-md transition"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreenBuilder;
