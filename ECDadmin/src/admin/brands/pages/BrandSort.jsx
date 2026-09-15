import React, { useEffect, useState } from 'react';
import { Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { useBrandList } from '../../api/brands.js';

import {
  DndContext,
  closestCenter
} from '@dnd-kit/core';

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

/* ---------- Sortable Item ---------- */
const SortableItem = ({ brand }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: brand._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ListItem
        className="hover:bg-gray-50 transition-colors cursor-move"
        sx={{ py: 1.5, px: 3 }}
      >
        <ListItemText
          primary={brand.name}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            color: '#4b5563',
            fontWeight: 400
          }}
        />
      </ListItem>
    </div>
  );
};

/* ---------- Main Component ---------- */
const BrandSort = () => {
  const { brands, loading, error } = useBrandList();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(brands);
  }, [brands]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex(b => b._id === active.id);
      const newIndex = prev.findIndex(b => b._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Brand Sort"
        breadcrumbs={[
          { label: "Brand" },
          { label: "Brand Sort", active: true }
        ]}
      />

      <div className="mb-4">
        <button className="bg-[#248C70] text-white px-6 py-1.5 rounded-md font-medium hover:bg-[#008d75] transition-colors shadow-sm">
          Save
        </button>
      </div>

      <Paper elevation={0} className="border border-gray-200 rounded-lg overflow-hidden">
        {loading && <p className="p-4 text-sm text-gray-500">Loading brands...</p>}
        {error && <p className="p-4 text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(b => b._id)}
              strategy={verticalListSortingStrategy}
            >
              <List disablePadding>
                {items.map((brand, index) => (
                  <React.Fragment key={brand._id}>
                    <SortableItem brand={brand} />
                    {index < items.length - 1 && (
                      <Divider component="li" sx={{ borderColor: '#f3f4f6' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </SortableContext>
          </DndContext>
        )}
      </Paper>
    </div>
  );
};

export default BrandSort;
