import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import {useFoodQuantities} from "../../api/food";

function AddFoodQuantityForm() {
  const { createQuantity } = useFoodQuantities();
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createQuantity({ name, isActive: true });
    setName("");
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Category Name</label>
          <TextField
            fullWidth
            placeholder="Category Name"
            variant="outlined"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <Button
          type="submit"
          variant="contained"
          sx={{
            backgroundColor: "#00a65a",
            "&:hover": { backgroundColor: "#008d4c" },
            textTransform: "none",
            px: 4,
          }}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

export default AddFoodQuantityForm;
