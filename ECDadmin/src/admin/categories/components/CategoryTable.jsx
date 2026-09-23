import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
  Refresh,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { useMasterCategory } from "../../api/category.js";

const PRIMARY_COLOR = "#248C70";

const CategoryTable = () => {
  const {
    categories,
    subcategories,
    loading,
    error,
    addCategory,
    updateCategory,
    patchCategoryStatus,
    reorderCategories,
    deleteCategory,
    fetchSubcategories,
    refetch,
  } = useMasterCategory();

  const [activeTab, setActiveTab] = useState(0); // 0 = Main Categories, 1 = Subcategories
  const [selectedParentId, setSelectedParentId] = useState("");
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "success" });

  // Dialog State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formType, setFormType] = useState("main"); // 'main' or 'subcategory'

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentCategoryId: "",
    description: "",
    image: "",
    icon: "",
    position: 0,
    isActive: true,
    isVisible: true,
    isFeatured: false,
    userAppVisible: true,
    restaurantAppVisible: true,
  });

  const showAlert = (message, severity = "success") => {
    setAlertInfo({ show: true, message, severity });
    setTimeout(() => setAlertInfo({ show: false, message: "", severity: "success" }), 4000);
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchSubcategories(selectedParentId);
    }
  }, [activeTab, selectedParentId, fetchSubcategories]);

  const mainCategoriesList = categories.filter((c) => c.type === "main" || !c.type);

  const handleOpenAddModal = (type = "main", parentId = "") => {
    setEditingCategory(null);
    setFormType(type);
    setFormData({
      name: "",
      slug: "",
      parentCategoryId: parentId || (mainCategoriesList[0]?._id || ""),
      description: "",
      image: "",
      icon: "",
      position: (type === "main" ? mainCategoriesList.length : subcategories.length) + 1,
      isActive: true,
      isVisible: true,
      isFeatured: false,
      userAppVisible: true,
      restaurantAppVisible: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormType(cat.type || "main");
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      parentCategoryId: cat.parentCategoryId?._id || cat.parentCategoryId || "",
      description: cat.description || "",
      image: cat.image || "",
      icon: cat.icon || "",
      position: cat.position || 0,
      isActive: cat.isActive !== false,
      isVisible: cat.isVisible !== false,
      isFeatured: cat.isFeatured === true,
      userAppVisible: cat.userAppVisible !== false,
      restaurantAppVisible: cat.restaurantAppVisible !== false,
    });
    setModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (!formData.name.trim()) {
        showAlert("Category name is required", "error");
        return;
      }

      if (formType === "subcategory" && !formData.parentCategoryId) {
        showAlert("Parent Category is required for subcategory", "error");
        return;
      }

      const payload = {
        ...formData,
        type: formType,
      };

      if (editingCategory) {
        await updateCategory(editingCategory._id, payload);
        showAlert(`${formType === "subcategory" ? "Subcategory" : "Category"} updated successfully!`);
      } else {
        await addCategory(payload);
        showAlert(`${formType === "subcategory" ? "Subcategory" : "Category"} created successfully!`);
      }

      setModalOpen(false);
      if (activeTab === 1) fetchSubcategories(selectedParentId);
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || err.message || "Failed to save category", "error");
    }
  };

  const handleToggleStatus = async (cat, field) => {
    try {
      const payload = { [field]: !cat[field] };
      await patchCategoryStatus(cat._id, payload);
      showAlert(`Updated ${field} status for ${cat.name}`);
      if (activeTab === 1) fetchSubcategories(selectedParentId);
    } catch (err) {
      console.error(err);
      showAlert("Failed to update status", "error");
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete ${cat.name}?`)) return;
    try {
      await deleteCategory(cat._id);
      showAlert(`${cat.name} deleted successfully!`);
      if (activeTab === 1) fetchSubcategories(selectedParentId);
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || "Cannot delete category", "error");
    }
  };

  const handleMovePosition = async (index, direction, list) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === list.length - 1)) return;
    const newList = [...list];
    const targetIndex = index + direction;

    // Swap positions
    const temp = newList[index].position;
    newList[index].position = newList[targetIndex].position;
    newList[targetIndex].position = temp;

    const orders = newList.map((item) => ({ id: item._id, position: item.position }));
    try {
      await reorderCategories(orders);
      showAlert("Categories reordered successfully");
      if (activeTab === 1) fetchSubcategories(selectedParentId);
    } catch (err) {
      console.error(err);
      showAlert("Failed to reorder", "error");
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {alertInfo.show && (
        <Alert severity={alertInfo.severity} sx={{ mb: 2 }}>
          {alertInfo.message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs & Top Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
          <Tab label={`Main Categories (${mainCategoriesList.length})`} />
          <Tab label={`Subcategories (${subcategories.length})`} />
        </Tabs>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton onClick={() => refetch()} title="Refresh">
            <Refresh />
          </IconButton>
          {activeTab === 0 ? (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenAddModal("main")} sx={{ backgroundColor: PRIMARY_COLOR }}>
              Add Main Category
            </Button>
          ) : (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenAddModal("subcategory", selectedParentId)} sx={{ backgroundColor: PRIMARY_COLOR }}>
              Add Subcategory
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter by Parent Category for Subcategories Tab */}
      {activeTab === 1 && (
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Filter by Parent Category:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <Select value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} displayEmpty>
              <MenuItem value="">-- All Parent Categories --</MenuItem>
              {mainCategoriesList.map((parent) => (
                <MenuItem key={parent._id} value={parent._id}>
                  {parent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
        /* MAIN CATEGORIES TABLE */
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
              <TableRow>
                <TableCell>Icon / Image</TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="center">Subcategories</TableCell>
                <TableCell align="center">Position</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">User App</TableCell>
                <TableCell align="center">Restaurant App</TableCell>
                <TableCell align="center">Featured</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mainCategoriesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No main categories found. Click "Add Main Category" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                mainCategoriesList.map((cat, idx) => (
                  <TableRow key={cat._id} hover>
                    <TableCell>
                      <Box
                        component="img"
                        src={cat.image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"}
                        alt={cat.name}
                        sx={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", border: "1px solid #eee" }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{cat.slug}</TableCell>
                    <TableCell align="center">
                      <Chip label={cat.subcategoryCount || 0} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <IconButton size="small" disabled={idx === 0} onClick={() => handleMovePosition(idx, -1, mainCategoriesList)}>
                          <ArrowUpward fontSize="inherit" />
                        </IconButton>
                        <span>{cat.position || idx + 1}</span>
                        <IconButton size="small" disabled={idx === mainCategoriesList.length - 1} onClick={() => handleMovePosition(idx, 1, mainCategoriesList)}>
                          <ArrowDownward fontSize="inherit" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={cat.isActive !== false} onChange={() => handleToggleStatus(cat, "isActive")} color="success" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleStatus(cat, "userAppVisible")}>
                        {cat.userAppVisible !== false ? <Visibility color="primary" fontSize="small" /> : <VisibilityOff color="disabled" fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleStatus(cat, "restaurantAppVisible")}>
                        {cat.restaurantAppVisible !== false ? <Visibility color="secondary" fontSize="small" /> : <VisibilityOff color="disabled" fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleStatus(cat, "isFeatured")}>
                        {cat.isFeatured ? <Star sx={{ color: "#E89D1E" }} fontSize="small" /> : <StarBorder color="disabled" fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Subcategories">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedParentId(cat._id);
                            setActiveTab(1);
                          }}
                        >
                          <Chip label="Subs" size="small" clickable />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => handleOpenEditModal(cat)} color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(cat)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* SUBCATEGORIES TABLE */
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
              <TableRow>
                <TableCell>Subcategory Name</TableCell>
                <TableCell>Parent Category</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="center">Position</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">User App</TableCell>
                <TableCell align="center">Restaurant App</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subcategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No subcategories found for selected filter. Click "Add Subcategory" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                subcategories.map((sub, idx) => (
                  <TableRow key={sub._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{sub.name}</TableCell>
                    <TableCell>
                      <Chip label={sub.parentCategoryId?.name || "Unassigned"} size="small" color="default" />
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{sub.slug}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <IconButton size="small" disabled={idx === 0} onClick={() => handleMovePosition(idx, -1, subcategories)}>
                          <ArrowUpward fontSize="inherit" />
                        </IconButton>
                        <span>{sub.position || idx + 1}</span>
                        <IconButton size="small" disabled={idx === subcategories.length - 1} onClick={() => handleMovePosition(idx, 1, subcategories)}>
                          <ArrowDownward fontSize="inherit" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={sub.isActive !== false} onChange={() => handleToggleStatus(sub, "isActive")} color="success" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleStatus(sub, "userAppVisible")}>
                        {sub.userAppVisible !== false ? <Visibility color="primary" fontSize="small" /> : <VisibilityOff color="disabled" fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleStatus(sub, "restaurantAppVisible")}>
                        {sub.restaurantAppVisible !== false ? <Visibility color="secondary" fontSize="small" /> : <VisibilityOff color="disabled" fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenEditModal(sub)} color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(sub)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? `Edit ${formType === "subcategory" ? "Subcategory" : "Category"}` : `Add ${formType === "subcategory" ? "Subcategory" : "Category"}`}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label={`${formType === "subcategory" ? "Subcategory" : "Category"} Name`}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            {formType === "subcategory" && (
              <FormControl fullWidth required>
                <InputLabel>Parent Category</InputLabel>
                <Select value={formData.parentCategoryId} onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })} label="Parent Category">
                  {mainCategoriesList.map((parent) => (
                    <MenuItem key={parent._id} value={parent._id}>
                      {parent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Slug (Auto-generated if empty)"
              fullWidth
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              helperText="URL friendly identifier"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <TextField
              label="Image URL"
              fullWidth
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
            />

            <TextField
              label="Display Position"
              type="number"
              fullWidth
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
            />

            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                <Typography variant="body2">Active</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Switch checked={formData.userAppVisible} onChange={(e) => setFormData({ ...formData, userAppVisible: e.target.checked })} />
                <Typography variant="body2">User App Visible</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Switch checked={formData.restaurantAppVisible} onChange={(e) => setFormData({ ...formData, restaurantAppVisible: e.target.checked })} />
                <Typography variant="body2">Restaurant App Visible</Typography>
              </Box>
              {formType === "main" && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Switch checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                  <Typography variant="body2">Featured</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory} sx={{ backgroundColor: PRIMARY_COLOR }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryTable;
