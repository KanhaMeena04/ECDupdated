import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@mui/material';
import { useFilterCategories } from '../../api/filtter';

const STORAGE_KEY = 'filter_category_sort_order';

const FilterSortTable = () => {
  const { categories, fetchCategories } = useFilterCategories();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchCategories({ page: 1, limit: 100 });
  }, [fetchCategories]);

  useEffect(() => {
    if (!categories.length) return;

    const savedOrder = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const categoryMap = new Map(categories.map(c => [c._id, c]));

    const ordered = savedOrder
      .map(id => categoryMap.get(id))
      .filter(Boolean);

    const newItems = categories.filter(c => !savedOrder.includes(c._id));

    setItems([...ordered, ...newItems]);
  }, [categories]);

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setItems(reordered);
  };

  const handleSave = () => {
    const ids = items.map(i => i._id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  const uiItems = useMemo(
    () =>
      items.map(item => ({
        id: item._id,
        name: typeof item.name === 'object' ? item.name.en : item.name,
        icon: item.icon || 'ðŸ”–',
      })),
    [items]
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <Button
          variant="contained"
          onClick={handleSave}
          className="bg-[#00a689] hover:bg-[#1c6d57] capitalize px-8 py-1.5"
          sx={{ backgroundColor: '#00a689', '&:hover': { backgroundColor: '#1c6d57' } }}
        >
          Save
        </Button>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="filter-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="border-t border-gray-100 shadow-sm rounded-sm"
            >
              {uiItems.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-3 p-3 border-b border-gray-100 text-sm text-gray-600 transition-colors ${
                        snapshot.isDragging
                          ? 'bg-blue-50 shadow-md'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default FilterSortTable;
