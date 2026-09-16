import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Switch,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Store,
  Category,
  RestaurantMenu,
  History,
  Star,
  Edit,
  Add,
  CheckCircle,
  Cancel,
  Refresh,
  LocalOffer,
  Visibility,
  VisibilityOff,
  CloudUpload,
} from "@mui/icons-material";
import api from "../../../utils/api";

const PRIMARY_COLOR = "#248C70";
const ACCENT_COLOR = "#E89D1E";

export default function CatalogMasterControl() {
  const [activeTab, setActiveTab] = useState(0);

  // Common State
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "success" });

  // Data States
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [priceOverrideModal, setPriceOverrideModal] = useState({ open: false, product: null });
  const [overrideForm, setOverrideForm] = useState({ basePrice: "", mrp: "", discountPercent: "", reason: "" });
  
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", image: "", isFeatured: false, userAppVisible: true });

  const [offerModal, setOfferModal] = useState({ open: false, restaurantId: null });
  const [offerForm, setOfferForm] = useState({ title: "", code: "", discountPercent: 10, maxDiscount: 100, minOrder: 199, description: "" });

  const showAlert = (message, severity = "success") => {
    setAlertInfo({ show: true, message, severity });
    setTimeout(() => setAlertInfo({ show: false, message: "", severity: "success" }), 4000);
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/catalog/restaurants");
      setRestaurants(res.data.restaurants || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load restaurants", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/catalog/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRestaurant) params.restaurantId = selectedRestaurant;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get("/api/catalog/products", { params });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/catalog/audit-logs");
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) fetchRestaurants();
    if (activeTab === 1) fetchCategories();
    if (activeTab === 2) {
      fetchRestaurants();
      fetchCategories();
      fetchProducts();
    }
    if (activeTab === 3) fetchAuditLogs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 2) {
      fetchProducts();
    }
  }, [selectedRestaurant, selectedCategory, searchQuery]);

  // Handler: Restaurant Master Control Switch
  const handleRestaurantControl = async (id, fields) => {
    try {
      await api.put(`/api/catalog/restaurants/${id}/master-control`, fields);
      showAlert("Restaurant master control updated!");
      fetchRestaurants();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to update restaurant", "error");
    }
  };

  // Handler: Add Restaurant Offer
  const handleAddOfferSubmit = async () => {
    try {
      await api.post(`/api/catalog/restaurants/${offerModal.restaurantId}/offers`, offerForm);
      showAlert("Offer created successfully!");
      setOfferModal({ open: false, restaurantId: null });
      fetchRestaurants();
    } catch (err) {
      showAlert("Failed to add offer", "error");
    }
  };

  // Handler: Category Toggle & Save
  const handleCategoryToggle = async (cat) => {
    try {
      await api.put(`/api/catalog/categories/${cat._id}`, {
        userAppVisible: !cat.userAppVisible,
        reason: "Admin toggled User App visibility",
      });
      showAlert("Category visibility updated!");
      fetchCategories();
    } catch (err) {
      showAlert("Failed to update category", "error");
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (categoryModal.category) {
        await api.put(`/api/catalog/categories/${categoryModal.category._id}`, categoryForm);
        showAlert("Category updated successfully!");
      } else {
        await api.post("/api/catalog/categories", categoryForm);
        showAlert("Category created successfully!");
      }
      setCategoryModal({ open: false, category: null });
      fetchCategories();
    } catch (err) {
      showAlert("Failed to save category", "error");
    }
  };

  // Handler: Price Override Submit
  const handlePriceOverrideSubmit = async () => {
    try {
      const prodId = priceOverrideModal.product._id;
      await api.put(`/api/catalog/products/${prodId}/price-override`, {
        isOverridden: true,
        basePrice: Number(overrideForm.basePrice),
        mrp: Number(overrideForm.mrp),
        discountPercent: Number(overrideForm.discountPercent),
        reason: overrideForm.reason || "Admin price override from Control Tower",
      });
      showAlert("Price override applied successfully! Original base price preserved.");
      setPriceOverrideModal({ open: false, product: null });
      fetchProducts();
    } catch (err) {
      showAlert("Failed to apply price override", "error");
    }
  };

  const handleClearPriceOverride = async (prodId) => {
    try {
      await api.put(`/api/catalog/products/${prodId}/price-override`, {
        isOverridden: false,
        reason: "Admin cleared price override",
      });
      showAlert("Price override cleared. Restored restaurant base price.");
      fetchProducts();
    } catch (err) {
      showAlert("Failed to clear price override", "error");
    }
  };

  // Handler: Product Status (OOS, Veg, Featured)
  const handleProductStatusToggle = async (id, fields) => {
    try {
      await api.patch(`/api/catalog/products/${id}/status`, fields);
      showAlert("Product status updated!");
      fetchProducts();
    } catch (err) {
      showAlert("Failed to update status", "error");
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#F4F7F6", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1F2937" }}>
            Catalog & Product Master Control Tower
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            Central Control Tower for Restaurants, Categories, Menu Items, Price Overrides & Audit Logs
          </Typography>
        </Box>
        <Chip
          label="LOCAL DEV ONLY — SAFE MODE"
          color="success"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {alertInfo.show && (
        <Alert severity={alertInfo.severity} sx={{ mb: 3 }}>
          {alertInfo.message}
        </Alert>
      )}

      {/* Control Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem" },
            "& .Mui-selected": { color: PRIMARY_COLOR },
          }}
        >
          <Tab icon={<Store />} iconPosition="start" label="Restaurant Master Control" />
          <Tab icon={<Category />} iconPosition="start" label="Categories & Subcategories" />
          <Tab icon={<RestaurantMenu />} iconPosition="start" label="Menu Items & Price Overrides" />
          <Tab icon={<History />} iconPosition="start" label="Audit Logs" />
        </Tabs>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* TAB 0: RESTAURANT MASTER CONTROL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Restaurant Directory & Availability Controls ({restaurants.length})
            </Typography>
            <IconButton onClick={fetchRestaurants} color="primary">
              <Refresh />
            </IconButton>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 5 }}><CircularProgress color="success" /></Box>
          ) : (
            <Grid container spacing={3}>
              {restaurants.map((r) => {
                const name = typeof r.name === "object" ? r.name.en : r.name;
                const isOverridden = r.adminOverride?.isOverridden;

                return (
                  <Grid item xs={12} md={6} lg={4} key={r._id}>
                    <Card sx={{ borderRadius: 3, height: "100%", border: isOverridden ? `2px solid ${ACCENT_COLOR}` : "1px solid #E5E7EB" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                            {name}
                          </Typography>
                          {isOverridden && (
                            <Tooltip title="Admin Override Active">
                              <Chip label="Admin Override" size="small" sx={{ bgcolor: "#FFFBEB", color: ACCENT_COLOR, fontWeight: 700 }} />
                            </Tooltip>
                          )}
                        </Box>

                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {r.city} • Prep: {r.estimatedPreparationTime || 15} mins • Comm: {r.adminCommission}%
                        </Typography>

                        <Box sx={{ bgcolor: "#F9FAFB", p: 1.5, borderRadius: 2, mb: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Featured on User Home</Typography>
                            <Switch
                              checked={r.isFeatured || false}
                              onChange={(e) => handleRestaurantControl(r._id, { isFeatured: e.target.checked })}
                              color="success"
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Online Status (Accepting Orders)</Typography>
                            <Switch
                              checked={r.isOnline !== false}
                              onChange={(e) => handleRestaurantControl(r._id, { isOnline: e.target.checked })}
                              color="success"
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Account Active</Typography>
                            <Switch
                              checked={r.isActive !== false}
                              onChange={(e) => handleRestaurantControl(r._id, { isActive: e.target.checked })}
                              color="success"
                              size="small"
                            />
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LocalOffer />}
                            onClick={() => setOfferModal({ open: true, restaurantId: r._id })}
                            sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
                          >
                            Add Offer ({r.offers?.length || 0})
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CATEGORIES & SUBCATEGORIES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              User App Category Hierarchy ({categories.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ bgcolor: PRIMARY_COLOR }}
              onClick={() => {
                setCategoryForm({ name: "", description: "", image: "", isFeatured: false, userAppVisible: true });
                setCategoryModal({ open: true, category: null });
              }}
            >
              Add New Category
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Category Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subcategories</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User App Visible</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Featured</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((c) => {
                  const catName = typeof c.name === "object" ? c.name.en : c.name;
                  return (
                    <TableRow key={c._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{catName}</TableCell>
                      <TableCell color="textSecondary">{c.description || "-"}</TableCell>
                      <TableCell>
                        {c.subcategories?.length > 0 ? (
                          c.subcategories.map((sub, idx) => (
                            <Chip key={idx} label={sub.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))
                        ) : (
                          <Typography variant="caption" color="textSecondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell>{c.position || 0}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleCategoryToggle(c)} color={c.userAppVisible ? "success" : "default"}>
                          {c.userAppVisible ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {c.isFeatured ? <Chip label="Featured" size="small" color="warning" /> : "-"}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setCategoryForm({
                              name: catName,
                              description: c.description || "",
                              image: c.image || "",
                              isFeatured: c.isFeatured || false,
                              userAppVisible: c.userAppVisible !== false,
                            });
                            setCategoryModal({ open: true, category: c });
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: MENU ITEMS & PRICE OVERRIDES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 2 && (
        <Box>
          {/* Filters Bar */}
          <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Restaurant</InputLabel>
                  <Select
                    value={selectedRestaurant}
                    label="Filter by Restaurant"
                    onChange={(e) => setSelectedRestaurant(e.target.value)}
                  >
                    <MenuItem value="">All Restaurants</MenuItem>
                    {restaurants.map((r) => (
                      <MenuItem key={r._id} value={r._id}>
                        {typeof r.name === "object" ? r.name.en : r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Filter by Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {typeof c.name === "object" ? c.name.en : c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Menu Item"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Product Items Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Restaurant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Original Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>MRP</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Discount %</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Effective User Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status / OOS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price Override</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => {
                  const prodName = typeof p.name === "object" ? p.name.en : p.name;
                  const restName = typeof p.restaurant?.name === "object" ? p.restaurant.name.en : (p.restaurant?.name || "N/A");
                  const isOverridden = p.adminPriceOverride?.isOverridden;

                  return (
                    <TableRow key={p._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{prodName}</Typography>
                          {p.isVeg ? (
                            <Chip label="Veg" size="small" color="success" variant="outlined" />
                          ) : (
                            <Chip label="Non-Veg" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>{restName}</TableCell>
                      <TableCell sx={{ color: "#6B7280" }}>₹{p.originalBasePrice ?? p.basePrice}</TableCell>
                      <TableCell>₹{p.mrp || (p.price * 1.2).toFixed(0)}</TableCell>
                      <TableCell>{p.discountPercent || 0}%</TableCell>
                      
                      <TableCell sx={{ fontWeight: 800, color: PRIMARY_COLOR }}>
                        ₹{p.price}
                        {isOverridden && (
                          <Chip label="Overridden" size="small" sx={{ ml: 1, bgcolor: "#FFFBEB", color: ACCENT_COLOR, fontSize: "0.7rem" }} />
                        )}
                      </TableCell>

                      <TableCell>
                        <FormControl label="OOS">
                          <Chip
                            label={p.outOfStock ? "Out of Stock" : "In Stock"}
                            color={p.outOfStock ? "error" : "success"}
                            size="small"
                            onClick={() => handleProductStatusToggle(p._id, { outOfStock: !p.outOfStock })}
                            sx={{ cursor: "pointer" }}
                          />
                        </FormControl>
                      </TableCell>

                      <TableCell>
                        {isOverridden ? (
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => {
                                setOverrideForm({
                                  basePrice: p.price,
                                  mrp: p.mrp || p.price,
                                  discountPercent: p.discountPercent || 0,
                                  reason: p.adminPriceOverride?.reason || "",
                                });
                                setPriceOverrideModal({ open: true, product: p });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleClearPriceOverride(p._id)}
                            >
                              Reset
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ bgcolor: PRIMARY_COLOR }}
                            onClick={() => {
                              setOverrideForm({
                                basePrice: p.price,
                                mrp: p.mrp || (p.price * 1.2).toFixed(0),
                                discountPercent: p.discountPercent || 0,
                                reason: "Admin price adjustment",
                              });
                              setPriceOverrideModal({ open: true, product: p });
                            }}
                          >
                            Override Price
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: AUDIT LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              System Audit Trail ({auditLogs.length})
            </Typography>
            <IconButton onClick={fetchAuditLogs} color="primary">
              <Refresh />
            </IconButton>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Field Changed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason / Note</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Performed By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell sx={{ fontSize: "0.85rem" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell><Chip label={log.entity} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell><Chip label={log.action} size="small" color={log.action === "admin_override" ? "warning" : "default"} /></TableCell>
                    <TableCell>{log.changes?.field || "-"}</TableCell>
                    <TableCell>{log.reason || "-"}</TableCell>
                    <TableCell>{log.userId?.name || log.userId?.email || "Admin"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: PRICE OVERRIDE */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={priceOverrideModal.open} onClose={() => setPriceOverrideModal({ open: false, product: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Admin Price Override</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Preserves restaurant's original price (₹{priceOverrideModal.product?.originalBasePrice ?? priceOverrideModal.product?.basePrice}) while applying an Admin override for User App.
          </Typography>

          <TextField
            fullWidth
            label="Admin Effective Price (₹)"
            type="number"
            value={overrideForm.basePrice}
            onChange={(e) => setOverrideForm({ ...overrideForm, basePrice: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="MRP (₹)"
            type="number"
            value={overrideForm.mrp}
            onChange={(e) => setOverrideForm({ ...overrideForm, mrp: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Discount (%)"
            type="number"
            value={overrideForm.discountPercent}
            onChange={(e) => setOverrideForm({ ...overrideForm, discountPercent: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Reason for Override (Mandatory for Audit)"
            multiline
            rows={2}
            value={overrideForm.reason}
            onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPriceOverrideModal({ open: false, product: null })}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: PRIMARY_COLOR }} onClick={handlePriceOverrideSubmit}>
            Apply Override
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: CATEGORY FORM */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={categoryModal.open} onClose={() => setCategoryModal({ open: false, category: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{categoryModal.category ? "Edit Category" : "Create Category"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Image URL"
            value={categoryForm.image}
            onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2">User App Visible</Typography>
            <Switch
              checked={categoryForm.userAppVisible}
              onChange={(e) => setCategoryForm({ ...categoryForm, userAppVisible: e.target.checked })}
              color="success"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCategoryModal({ open: false, category: null })}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: PRIMARY_COLOR }} onClick={handleSaveCategory}>
            Save Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: RESTAURANT OFFER FORM */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={offerModal.open} onClose={() => setOfferModal({ open: false, restaurantId: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Restaurant Offer</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Offer Title (e.g. 20% OFF Special)"
            value={offerForm.title}
            onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Coupon Code (e.g. SPECIAL20)"
            value={offerForm.code}
            onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Discount %"
                type="number"
                value={offerForm.discountPercent}
                onChange={(e) => setOfferForm({ ...offerForm, discountPercent: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Order (₹)"
                type="number"
                value={offerForm.minOrder}
                onChange={(e) => setOfferForm({ ...offerForm, minOrder: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOfferModal({ open: false, restaurantId: null })}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: PRIMARY_COLOR }} onClick={handleAddOfferSubmit}>
            Add Offer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
