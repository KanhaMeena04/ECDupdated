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

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/home/admin/home-sections`, {
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

  useEffect(() => {
    fetchSections();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSection(null);
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

  const handleOpenEditModal = (sec) => {
    setEditingSection(sec);
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
      isActive: sec.isActive !== undefined ? sec.isActive : true,
    });
    setShowModal(true);
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/home/admin/home-sections/${id}/toggle`,
        {},
        { withCredentials: true }
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
      const res = await axios.delete(`${API_BASE_URL}/api/home/admin/home-sections/${id}`, {
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
      await axios.put(
        `${API_BASE_URL}/api/home/admin/home-sections/reorder`,
        { items: itemsToUpdate },
        { withCredentials: true }
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
      if (editingSection) {
        const res = await axios.put(
          `${API_BASE_URL}/api/home/admin/home-sections/${editingSection._id}`,
          formData,
          { withCredentials: true }
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
          { withCredentials: true }
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#185d4b] via-[#248C70] to-[#124b3c] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-6 h-6 text-[#E89D1E]" />
            <h2 className="text-2xl font-black tracking-tight">Customer App Home Layout CMS</h2>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Reorder, enable/disable, and configure sections displayed on the Customer App Home Screen dynamically.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 bg-[#E89D1E] hover:bg-[#d48c18] text-white font-bold px-5 py-2.5 rounded-xl transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" /> Add New Section
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
          {sections.map((sec, index) => (
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
              <div className="flex items-center gap-2 self-end sm:self-center">
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
                  onClick={() => handleOpenEditModal(sec)}
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
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#248C70]" />
              {editingSection ? "Edit Home Section" : "Add New Home Section"}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Key (Unique)</label>
                <input
                  type="text"
                  required
                  value={formData.sectionKey}
                  onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                  disabled={!!editingSection}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none disabled:bg-gray-100"
                  placeholder="e.g. top_offers_carousel"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Heading / Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
                  placeholder="e.g. What's on your mind?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle (Optional)</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
                  placeholder="e.g. Explore top deals curated for you"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Type</label>
                <select
                  value={formData.sectionType}
                  onChange={(e) => setFormData({ ...formData, sectionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
                >
                  <option value="banner_carousel">Banner Carousel</option>
                  <option value="category_grid">Food Categories Grid</option>
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
                    className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
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
                    className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
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
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
                  placeholder="e.g. category_id or URL"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Image URL (Optional)</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#248C70] focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#248C70] rounded focus:ring-[#248C70]"
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
                  {editingSection ? "Save Changes" : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreenBuilder;
