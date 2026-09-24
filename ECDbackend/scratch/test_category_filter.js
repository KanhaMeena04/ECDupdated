
const axios = require('axios');

function getCategoryKeywords(cat) {
  const c = cat.toLowerCase().trim();
  if (c === 'momos' || c === 'momo') return ['momo', 'momos'];
  if (c === 'burger' || c === 'burgers') return ['burger', 'burgers'];
  if (c === 'pizza' || c === 'pizzas') return ['pizza', 'pizzas'];
  if (c === 'biryani' || c === 'biriyani') return ['biryani', 'biriyani', 'pulao', 'dum biryani'];
  if (c === 'sandwich' || c === 'sandwiches') return ['sandwich', 'sandwiches'];
  if (c === 'chinese' || c === 'asian') return ['chinese', 'noodle', 'noodles', 'manchurian', 'chowmein', 'fried rice', 'chilli'];
  if (c === 'cake' || c === 'cakes' || c === 'dessert' || c === 'desserts' || c === 'sweet' || c === 'sweets') return ['cake', 'pastry', 'dessert', 'brownie', 'ice cream', 'gulab jamun', 'halwa', 'pastries'];
  if (c.includes('north indian')) return ['north indian', 'thali', 'dal makhani', 'paneer butter', 'chur chur naan', 'naan', 'roti', 'paratha', 'chole'];
  if (c.includes('main course') || c === 'main') return ['main course', 'thali', 'curry', 'gravy', 'paneer lababdar', 'butter chicken'];
  if (c.includes('beverage') || c.includes('drink') || c.includes('coffee')) return ['beverage', 'beverages', 'shake', 'juice', 'coffee', 'tea', 'cold drink', 'soda', 'drink', 'drinks', 'smoothie', 'lassi'];
  return [c];
}

function matchesCategory(dish, restaurant, keywords) {
  const dishCat = (dish.category || '').toLowerCase();
  const dishSub = (dish.subcategory || '').toLowerCase();
  const dishName = (dish.name || '').toLowerCase();

  for (const k of keywords) {
    const kLow = k.toLowerCase();
    // 1. Direct dish category or subcategory match
    if (dishCat.includes(kLow) || dishSub.includes(kLow)) return true;

    // 2. Dish name check with word boundary for short keywords
    if (kLow.length <= 3) {
      const regex = new RegExp(`(?:^|[\\s/,.-])${kLow}(?:$|[\\s/,.-])`, 'i');
      if (regex.test(dishName)) return true;
    } else {
      if (dishName.includes(kLow)) return true;
    }
  }
  return false;
}

function filterRestaurants(restaurants, categoryTitle) {
  const keywords = getCategoryKeywords(categoryTitle);
  return restaurants.filter(r => {
    // 1. Menu items matching
    const matchingDishes = (r.menu || []).filter(d => matchesCategory(d, r, keywords));
    if (matchingDishes.length > 0) return true;

    // 2. Cuisine match (only if cuisine specifically matches category keyword)
    const cuisines = Array.isArray(r.cuisine) ? r.cuisine : (r.cuisine ? [r.cuisine] : []);
    return cuisines.some(c => {
      const cLow = c.toLowerCase();
      return keywords.some(k => cLow === k.toLowerCase() || (k.length > 3 && cLow.includes(k.toLowerCase())));
    });
  });
}

axios.get('http://127.0.0.1:5000/api/restaurants/list').then(res => {
  const list = res.data.restaurants;
  const categories = ['Momos', 'Burger', 'Pizza', 'Chinese', 'Biryani', 'Sandwich', 'North Indian', 'Main Course', 'Beverages', 'Cake'];
  
  categories.forEach(cat => {
    const matched = filterRestaurants(list, cat);
    console.log(`📌 CATEGORY: ${cat} -> (${matched.length} restaurants)`);
    matched.forEach(m => {
      const name = typeof m.name === 'object' ? m.name.en : m.name;
      const kws = getCategoryKeywords(cat);
      const matchingDishes = (m.menu || []).filter(d => matchesCategory(d, m, kws)).map(d => d.name);
      console.log(`   - ${name} => Matches: [${matchingDishes.join(', ')}]`);
    });
    console.log('');
  });
}).catch(console.error);
