import React from 'react';
import {
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Store,
  Map,
  ReceiptLong
} from '@mui/icons-material';

import {useRestaurantApplication} from '../../api/restaurant.js';

const RestaurantApplicationForm = () => {
  const {
    formData,
    loading,
    status,
    handleChange,
    handleNestedChange,
    handleSubmit
  } = useRestaurantApplication();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Typography variant="h4" className="font-bold mb-2 text-center">
          Restaurant Partnership Application
        </Typography>
        <Typography className="text-gray-500 text-center mb-8">
          Submit your restaurant details for review.
        </Typography>

        {status.msg && (
          <Alert severity={status.type} className="mb-6">
            {status.msg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>

            {/* BASIC INFO */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Store className="text-orange-600" />
                    <Typography variant="h6">Basic Information</Typography>
                  </div>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Restaurant Name"
                        name="name"
                        value={formData.name.en}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cuisine"
                        name="cuisine"
                        value={formData.cuisine}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        name="description"
                        value={formData.description.en}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* LOCATION */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Map className="text-blue-600" />
                    <Typography variant="h6">Location & Contact</Typography>
                  </div>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="Area" name="area" value={formData.area} onChange={handleChange} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* OPERATIONS & BANK */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <ReceiptLong className="text-green-600" />
                    <Typography variant="h6">Operations & Bank</Typography>
                  </div>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Delivery Time"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mins</InputAdornment>
                        }}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Delivery Type"
                        name="deliveryType"
                        value={formData.deliveryType}
                        onChange={handleChange}
                      >
                        <MenuItem value="Home Delivery">Home Delivery</MenuItem>
                        <MenuItem value="Takeaway">Takeaway</MenuItem>
                        <MenuItem value="Both">Both</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankDetails.bankName}
                        onChange={(e) =>
                          handleNestedChange('bankDetails', 'bankName', e.target.value)
                        }
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* SUBMIT */}
            <Grid item xs={12} className="flex justify-end">
              <Button
                type="submit"
                variant="contained"
                className="bg-orange-600 hover:bg-orange-700 px-10 py-3"
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Submit Application'}
              </Button>
            </Grid>

          </Grid>
        </form>
      </div>
    </div>
  );
};

export default RestaurantApplicationForm;
