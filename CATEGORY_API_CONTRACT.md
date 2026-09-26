# Category API Contract Specification

## Public / Client Endpoints

### 1. `GET /api/categories/tree`
- **Description**: Returns hierarchical category tree (main categories with nested active subcategories).
- **Authentication**: Optional / Public
- **Response**:
```json
{
  "success": true,
  "count": 34,
  "data": [
    {
      "_id": "6ab0babfa52bf3e98e7098bc",
      "id": "6ab0babfa52bf3e98e7098bc",
      "name": "Pizza",
      "slug": "pizza",
      "description": "Pizza delicious selections",
      "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
      "position": 1,
      "isActive": true,
      "isFeatured": true,
      "subcategories": [
        {
          "_id": "6ab0babfa52bf3e98e7098bf",
          "name": "Veg Pizza",
          "slug": "veg-pizza",
          "position": 1
        }
      ]
    }
  ]
}
```

### 2. `GET /api/categories`
- **Query Params**: `type`, `parentCategoryId`, `search`, `isActive`, `userAppVisible`

---

## Protected Admin Endpoints

### 1. `GET /api/admin/categories`
- Returns detailed categories list with subcategory counts.

### 2. `POST /api/admin/categories`
- **Payload**: `{ name, slug, type, parentCategoryId, description, image, position, isActive, isFeatured }`

### 3. `PUT /api/admin/categories/:id`
- Updates category or subcategory attributes.

### 4. `PATCH /api/admin/categories/:id/status`
- **Payload**: `{ isActive, isVisible, isFeatured, userAppVisible, restaurantAppVisible }`

### 5. `PUT /api/admin/categories/reorder`
- **Payload**: `{ items: [{ id: "...", position: 1 }] }`

### 6. `DELETE /api/admin/categories/:id`
- Deletes category after validating no products reference it.
