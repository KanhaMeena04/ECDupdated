# Category Database Schema Specification

## Collection: `categories`

```javascript
{
  _id: ObjectId,
  name: String,               // Required, trim
  slug: String,               // Required, URL-safe identifier
  type: String,               // Enum: ["main", "subcategory"]
  parentCategoryId: ObjectId, // Ref: "Category", null for main categories
  description: String,
  image: String,              // Image URL
  icon: String,               // Icon identifier/URL
  position: Number,           // Display ordering integer
  isActive: Boolean,          // Operational status toggle
  isVisible: Boolean,         // Global visibility toggle
  isFeatured: Boolean,        // Home screen featured highlight toggle
  userAppVisible: Boolean,    // Customer app visibility
  restaurantAppVisible: Boolean, // Restaurant vendor app visibility
  seoTitle: String,
  seoDescription: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes
- `{ type: 1, position: 1 }`
- `{ parentCategoryId: 1, position: 1 }`
- `{ slug: 1 }`
- `{ parentCategoryId: 1, slug: 1 }`

## Product Model Integration (`products` collection)
- `categoryId`: ObjectId (ref: `Category`)
- `subcategoryId`: ObjectId (ref: `Category`)
- `category`: ObjectId (ref: `Category` - legacy field)
- `subcategory`: String (legacy field)
