import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button, Paper } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import axios from "axios";
import { API_BASE_URL } from "../../../utils/utils";
const SortCategoryUI = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/admin/master-category`, {
      withCredentials: true,
    }).then(res => setCategories(res.data));
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setCategories(
      items.map((item, index) => ({ ...item, order: index }))
    );
  };

  const saveOrder = async () => {
    await Promise.all(
      categories.map(cat =>
        axios.put(
          `${API_BASE_URL}/api/admin/master-category/${cat._id}`,
          { order: cat.order },
          { withCredentials: true }
        )
      )
    );
    alert("Order saved successfully");
  };

  if (categories.length === 0) {
    return <div className="justify-center items-center flex w-full h-full " >No categories found to sort. add  category to see</div>;
  }
  return (
    <>
      <Button variant="contained" onClick={saveOrder}>
        Save
      </Button>

      <Paper>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(p) => (
              <div ref={p.innerRef} {...p.droppableProps}>
                {categories.map((c, i) => (
                  <Draggable key={c._id} draggableId={c._id} index={i}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        className="flex p-3 border-b"
                      >
                        <DragIndicatorIcon />
                        {c.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {p.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>
    </>
  );
};

export default SortCategoryUI;