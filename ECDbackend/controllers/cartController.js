const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Restaurant = require("../models/Restaurant");
const Promocode = require("../models/Promocode");
const Order = require("../models/Order");
const { calculateBill } = require("./orderController"); // Import unified calculateBill
const { formatRestaurantForUser, formatProductForUser } = require("../utils/responseFormatter");
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate(
        "restaurant",
        "name description image cuisine rating address city area deliveryTime deliveryType isFreeDelivery minOrderValue estimatedPreparationTime isActive isTemporarilyClosed timing"
      )
      .populate("items.product");

    if (!cart)
      return res.status(200).json({ success: true, message: "Cart is empty", cart: null, items: [], bill: null });

    if (cart.items && cart.items.length > 0) {
      const originalLength = cart.items.length;
      cart.items = cart.items.filter((item) => item && item.restaurant);
      if (cart.items.length !== originalLength) {
        await cart.save();
      }
      if (cart.items.length === 0) {
        await Cart.findByIdAndDelete(cart._id);
        return res.status(200).json({ success: true, message: "Cart is empty", cart: null, items: [], bill: null });
      }
    }

    const formattedRestaurant = cart.restaurant
      ? formatRestaurantForUser(cart.restaurant)
      : null;

    const formattedItems = cart.items.map((item) => {
      const p = item.product || {};
      const pName = p.name ? (p.name.en || p.name.de || p.name.ar || p.name) : (item.name || "Item");
      const pDesc = p.description ? (p.description.en || p.description) : "";
      const pPrice = Number(item.price || p.sellingPrice || p.basePrice || 0);

      return {
        _id: item._id,
        id: item._id,
        product: item.product?._id || item.product,
        productId: {
          _id: p._id?.toString() || item.product?.toString() || "",
          id: p._id?.toString() || item.product?.toString() || "",
          name: pName,
          description: pDesc,
          price: pPrice,
          image: item.image || p.image || "",
          category: p.category?.toString() || "",
          rating: Number(p.rating || 4.5),
          isVeg: p.isVeg !== false,
          store: item.restaurant?.toString() || cart.restaurant?._id?.toString() || ""
        },
        image: item.image || p.image || "",
        name: pName,
        price: pPrice,
        quantity: item.quantity || 1,
        variation: item.variation || null,
        addOns: item.addOns || [],
      };
    });

    const bill = await calculateBill(cart, req.user._id);
    if (bill && bill.restaurantId && bill.restaurantId._id) {
      bill.restaurantId = bill.restaurantId._id;
    }

    const itemCount = formattedItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    res.status(200).json({
      success: true,
      items: formattedItems,
      cart: {
        _id: cart._id,
        user: cart.user,
        restaurant: formattedRestaurant,
        items: formattedItems,
        couponCode: cart.couponCode || null,
        tip: cart.tip || 0,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
      bill,
      itemCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode, code } = req.body;
    const resolvedCode = couponCode || code;
    const userId = req.user ? req.user._id : req.body.userId;
    if (!resolvedCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required." });
    }
    const cart = await Cart.findOne({ user: userId })
      .populate("restaurant")
      .populate("items.restaurant");
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }
    cart.couponCode = resolvedCode;
    const bill = await calculateBill(cart, userId);
    if (bill.couponError) {
      return res.status(400).json({ success: false, valid: false, message: bill.couponError });
    }
    return res.json({ success: true, valid: true, message: "Coupon is valid", discountAmount: bill.discountAmount || 0, bill, coupon: { code: resolvedCode.toUpperCase(), discount: bill.discountAmount || 0 } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.addToCart = async (req, res) => {
  try {
    let { restaurantId, productId, quantity, variationId, addOnsIds, clearCart } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!restaurantId) {
      restaurantId = product.restaurant?.toString();
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant ID could not be determined" });
    }

    const parsedQuantity = Number.isFinite(Number(quantity)) && Number(quantity) > 0
      ? parseInt(quantity, 10)
      : 1;

    const normalizedAddOnsIds = Array.isArray(addOnsIds)
      ? addOnsIds
      : addOnsIds && typeof addOnsIds === 'string' && addOnsIds.trim()
      ? [addOnsIds]
      : [];

    let cart = await Cart.findOne({ user: req.user._id });
    if (cart && cart.items.length > 0) {
      cart.items = cart.items.filter(item => item && item.restaurant);
      const existingRestaurantId = cart.restaurant ? cart.restaurant.toString() : null;
      if (existingRestaurantId && existingRestaurantId !== restaurantId.toString()) {
        if (clearCart) {
          cart.items = [];
          cart.restaurant = restaurantId;
          cart.couponCode = null;
          cart.tip = 0;
        } else {
          const existingRestaurant = await Restaurant.findById(existingRestaurantId);
          const newRestaurant = await Restaurant.findById(restaurantId);
          return res.status(409).json({
            success: false,
            message: "Cart contains items from another restaurant. Please place your current order first or clear your cart.",
            conflict: true,
            requiresAction: true,
            currentRestaurant: {
              id: existingRestaurantId,
              name: existingRestaurant ? existingRestaurant.name.en : "Current Restaurant"
            },
            newRestaurant: {
              id: restaurantId,
              name: newRestaurant ? newRestaurant.name.en : "New Restaurant"
            },
            actions: [
              { type: "place_order", label: "Place Current Order" },
              { type: "clear_cart", label: "Clear Cart & Start Fresh" }
            ]
          });
        }
      }
    }

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        restaurant: restaurantId,
        items: [],
      });
    } else {
      if (cart.items.length === 0) {
        cart.restaurant = restaurantId;
      }
    }

    let finalPrice = product.sellingPrice || product.basePrice || 0;
    let variationObj = null;
    let addOnsArr = [];

    if (variationId && product.variations) {
      const v = product.variations.id ? product.variations.id(variationId) : product.variations.find(va => va._id?.toString() === variationId);
      if (v) {
        const variationPrice = Number(v.price) || 0;
        finalPrice += variationPrice;
        const variationName = v.name?.en || v.name?.de || v.name?.ar || v.name || "";
        variationObj = { _id: v._id, name: variationName, price: variationPrice };
      }
    }

    if (normalizedAddOnsIds.length > 0 && product.addOns) {
      const uniqueAddOnIds = Array.from(new Set(normalizedAddOnsIds.map((id) => id.toString())));
      const selectedAddons = product.addOns.filter((a) =>
        uniqueAddOnIds.includes(a._id.toString())
      );
      selectedAddons.forEach((a) => {
        const addOnPrice = Number(a.price) || 0;
        finalPrice += addOnPrice;
        const addOnName = a.name?.en || a.name?.de || a.name?.ar || a.name || "";
        addOnsArr.push({ _id: a._id, name: addOnName, price: addOnPrice });
      });
    }

    const pName = product.name ? (product.name.en || product.name.de || product.name) : "Food Item";
    const cartItem = {
      product: productId,
      restaurant: restaurantId,
      name: pName,
      image: product.image,
      price: finalPrice,
      quantity: parsedQuantity,
      addOns: addOnsArr,
    };

    if (variationObj && typeof variationObj === 'object' && Object.keys(variationObj).length > 0) {
      cartItem.variation = variationObj;
    }

    const existingItemIndex = cart.items.findIndex(item => 
        item.product && item.product.toString() === productId.toString() && 
        JSON.stringify(item.variation) === JSON.stringify(cartItem.variation) &&
        JSON.stringify(item.addOns) === JSON.stringify(cartItem.addOns)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parsedQuantity;
      if (!cart.items[existingItemIndex].image) {
        cart.items[existingItemIndex].image = product.image;
      }
    } else {
      cart.items.push(cartItem);
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id)
      .populate("restaurant")
      .populate("items.restaurant")
      .lean();

    const bill = await calculateBill(cart, req.user._id);
    res.status(200).json({ 
      success: true,
      message: "Item added to cart successfully", 
      cart: updatedCart, 
      bill 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId, itemId } = { ...req.body, ...req.params };
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const targetId = itemId || productId;
    if (!targetId) {
      return res.status(400).json({ success: false, message: "Product ID or Item ID is required" });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== targetId && item.product?.toString() !== targetId
    );

    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return res.status(200).json({ 
        success: true,
        message: "Cart cleared", 
        cart: null, 
        bill: null 
      });
    }

    await cart.save();
    const bill = await calculateBill(cart, req.user._id);
    res.status(200).json({ 
      success: true,
      message: "Item removed from cart", 
      cart, 
      bill,
      itemCount: cart.items.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateItemQuantity = async (req, res) => {
  try {
    const { itemId, productId, quantity, action } = { ...req.body, ...req.params };
    const targetId = itemId || productId;
    if (!targetId) {
      return res.status(400).json({ success: false, message: "Item ID or Product ID is required" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(i => i._id.toString() === targetId || i.product?.toString() === targetId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    const item = cart.items[itemIndex];
    let newQuantity = Number(quantity);

    if (action === 'increase') {
      item.quantity += 1;
    } else if (action === 'decrease') {
      item.quantity -= 1;
    } else if (Number.isFinite(newQuantity)) {
      item.quantity = newQuantity;
    }

    if (item.quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return res.status(200).json({
        success: true,
        message: "Cart cleared",
        cart: null,
        bill: null,
        itemCount: 0
      });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id)
      .populate("restaurant")
      .populate("items.restaurant")
      .lean();

    const bill = await calculateBill(cart, req.user._id);
    res.status(200).json({
      success: true,
      message: `Item quantity updated`,
      cart: updatedCart,
      bill,
      itemCount: cart.items.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: null,
      bill: null,
      itemCount: 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartMeta = async (req, res) => {
  try {
    const { tip } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
    if (tip !== undefined) {
      const tipValue = Number(tip);
      if (!Number.isFinite(tipValue) || tipValue < 0) {
        return res.status(400).json({ success: false, message: "Tip must be a non-negative number" });
      }
      cart.tip = Math.round(tipValue * 100) / 100;
    }
    await cart.save();
    const bill = await calculateBill(cart, req.user._id);
    res.status(200).json({ success: true, message: "Cart updated", bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

