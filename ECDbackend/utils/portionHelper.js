/**
 * Portion & Variant Helper for ECDKART Menu System
 * Handles Half/Full plates, Small/Medium/Large sizes, Single prices, and Add-ons.
 * Crucial Rule: Missing fields MUST remain null/omitted, NEVER forced to 0.
 */

function parseNumberOrNull(val) {
  if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") {
    return null;
  }
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function normalizeAddOns(rawAddOns) {
  if (!rawAddOns) return [];
  let list = rawAddOns;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  return list.map((a) => {
    if (!a) return null;
    let nameEn = "";
    if (typeof a === "string") {
      nameEn = a.trim();
    } else if (typeof a.name === "string") {
      nameEn = a.name.trim();
    } else if (a.name && typeof a.name === "object") {
      nameEn = (a.name.en || a.name.de || a.name.ar || Object.values(a.name)[0] || "").trim();
    }
    if (!nameEn) return null;

    const price = parseNumberOrNull(a.price) ?? 0;
    return {
      name: { en: nameEn },
      price: price >= 0 ? price : 0,
      image: (typeof a.image === "string" ? a.image : "") || "",
    };
  }).filter(Boolean);
}

function normalizePortionsAndVariations(item = {}) {
  const rawPortionType = (item.portionType || item.portion_type || "").toString().toLowerCase().trim();
  const rawPortions = item.portions && typeof item.portions === "object" ? item.portions : {};
  const rawVariants = Array.isArray(item.variations) ? item.variations : (Array.isArray(item.variants) ? item.variants : []);

  // Check flat keys for Half / Full
  const flatHalfSelling = parseNumberOrNull(
    item.halfSellingPrice ?? item.halfPrice ?? item.half_selling_price ?? item.half_price ?? rawPortions.half?.sellingPrice ?? rawPortions.half?.price
  );
  const flatHalfMrp = parseNumberOrNull(
    item.halfMrp ?? item.half_mrp ?? rawPortions.half?.mrp ?? flatHalfSelling
  );
  const flatHalfB2b = parseNumberOrNull(
    item.halfB2bPrice ?? item.half_b2b_price ?? item.halfB2bSellingPrice ?? rawPortions.half?.b2bPrice ?? flatHalfSelling
  );

  const flatFullSelling = parseNumberOrNull(
    item.fullSellingPrice ?? item.fullPrice ?? item.full_selling_price ?? item.full_price ?? rawPortions.full?.sellingPrice ?? rawPortions.full?.price
  );
  const flatFullMrp = parseNumberOrNull(
    item.fullMrp ?? item.full_mrp ?? rawPortions.full?.mrp ?? flatFullSelling
  );
  const flatFullB2b = parseNumberOrNull(
    item.fullB2bPrice ?? item.full_b2b_price ?? item.fullB2bSellingPrice ?? rawPortions.full?.b2bPrice ?? flatFullSelling
  );

  // Check flat keys for Small / Medium / Large
  const flatSmallSelling = parseNumberOrNull(
    item.smallSellingPrice ?? item.smallPrice ?? item.small_selling_price ?? item.small_price ?? rawPortions.small?.sellingPrice ?? rawPortions.small?.price
  );
  const flatSmallMrp = parseNumberOrNull(
    item.smallMrp ?? item.small_mrp ?? rawPortions.small?.mrp ?? flatSmallSelling
  );
  const flatSmallB2b = parseNumberOrNull(
    item.smallB2bPrice ?? item.small_b2b_price ?? item.smallB2bSellingPrice ?? rawPortions.small?.b2bPrice ?? flatSmallSelling
  );

  const flatMedSelling = parseNumberOrNull(
    item.mediumSellingPrice ?? item.medSellingPrice ?? item.mediumPrice ?? item.medPrice ?? item.medium_selling_price ?? item.medium_price ?? rawPortions.medium?.sellingPrice ?? rawPortions.medium?.price
  );
  const flatMedMrp = parseNumberOrNull(
    item.mediumMrp ?? item.medMrp ?? item.medium_mrp ?? rawPortions.medium?.mrp ?? flatMedSelling
  );
  const flatMedB2b = parseNumberOrNull(
    item.mediumB2bPrice ?? item.medB2bPrice ?? item.medium_b2b_price ?? rawPortions.medium?.b2bPrice ?? flatMedSelling
  );

  const flatLargeSelling = parseNumberOrNull(
    item.largeSellingPrice ?? item.largePrice ?? item.large_selling_price ?? item.large_price ?? rawPortions.large?.sellingPrice ?? rawPortions.large?.price
  );
  const flatLargeMrp = parseNumberOrNull(
    item.largeMrp ?? item.large_mrp ?? rawPortions.large?.mrp ?? flatLargeSelling
  );
  const flatLargeB2b = parseNumberOrNull(
    item.largeB2bPrice ?? item.large_b2b_price ?? item.largeB2bSellingPrice ?? rawPortions.large?.b2bPrice ?? flatLargeSelling
  );

  // Check variants array for Half/Full or Small/Medium/Large if not found in flat
  let foundHalfInVariants = null;
  let foundFullInVariants = null;
  let foundSmallInVariants = null;
  let foundMedInVariants = null;
  let foundLargeInVariants = null;

  rawVariants.forEach((v) => {
    if (!v) return;
    const vName = (typeof v === "string" ? v : (v.name?.en || v.name || "")).toString().trim().toLowerCase();
    const vSell = parseNumberOrNull(v.sellingPrice ?? v.price);
    const vMrp = parseNumberOrNull(v.mrp ?? vSell);
    const vB2b = parseNumberOrNull(v.b2bPrice ?? vSell);

    if (vName === "half" || vName === "half plate" || vName.includes("half")) {
      foundHalfInVariants = { sellingPrice: vSell, mrp: vMrp, b2bPrice: vB2b };
    } else if (vName === "full" || vName === "full plate" || vName.includes("full")) {
      foundFullInVariants = { sellingPrice: vSell, mrp: vMrp, b2bPrice: vB2b };
    } else if (vName === "small" || vName.includes("small")) {
      foundSmallInVariants = { sellingPrice: vSell, mrp: vMrp, b2bPrice: vB2b };
    } else if (vName === "medium" || vName.includes("med")) {
      foundMedInVariants = { sellingPrice: vSell, mrp: vMrp, b2bPrice: vB2b };
    } else if (vName === "large" || vName.includes("large")) {
      foundLargeInVariants = { sellingPrice: vSell, mrp: vMrp, b2bPrice: vB2b };
    }
  });

  const halfSelling = flatHalfSelling ?? foundHalfInVariants?.sellingPrice;
  const halfMrp = flatHalfMrp ?? foundHalfInVariants?.mrp;
  const halfB2b = flatHalfB2b ?? foundHalfInVariants?.b2bPrice;

  const fullSelling = flatFullSelling ?? foundFullInVariants?.sellingPrice;
  const fullMrp = flatFullMrp ?? foundFullInVariants?.mrp;
  const fullB2b = flatFullB2b ?? foundFullInVariants?.b2bPrice;

  const smallSelling = flatSmallSelling ?? foundSmallInVariants?.sellingPrice;
  const smallMrp = flatSmallMrp ?? foundSmallInVariants?.mrp;
  const smallB2b = flatSmallB2b ?? foundSmallInVariants?.b2bPrice;

  const medSelling = flatMedSelling ?? foundMedInVariants?.sellingPrice;
  const medMrp = flatMedMrp ?? foundMedInVariants?.mrp;
  const medB2b = flatMedB2b ?? foundMedInVariants?.b2bPrice;

  const largeSelling = flatLargeSelling ?? foundLargeInVariants?.sellingPrice;
  const largeMrp = flatLargeMrp ?? foundLargeInVariants?.mrp;
  const largeB2b = flatLargeB2b ?? foundLargeInVariants?.b2bPrice;

  // Standard fallback prices
  const fallbackSelling = parseNumberOrNull(
    item.sellingPrice ?? item.b2cSellingPrice ?? item.price ?? item.basePrice
  ) ?? 0;
  const fallbackMrp = parseNumberOrNull(
    item.mrp ?? item.b2cMrp ?? item.originalPrice ?? fallbackSelling
  ) ?? fallbackSelling;
  const fallbackB2b = parseNumberOrNull(
    item.b2bPrice ?? item.b2bSellingPrice ?? fallbackSelling
  ) ?? fallbackSelling;

  let portionType = "none";
  let portions = null;
  let variations = [];

  const hasHalfFullData = (halfSelling !== null && halfSelling > 0) || (fullSelling !== null && fullSelling > 0);
  const hasSizeData = (smallSelling !== null && smallSelling > 0) || (medSelling !== null && medSelling > 0) || (largeSelling !== null && largeSelling > 0);

  if (rawPortionType === "half_full" || (!rawPortionType && hasHalfFullData)) {
    portionType = "half_full";
    portions = {
      half: halfSelling !== null ? {
        sellingPrice: halfSelling,
        mrp: halfMrp ?? halfSelling,
        b2bPrice: halfB2b ?? halfSelling,
      } : null,
      full: fullSelling !== null ? {
        sellingPrice: fullSelling,
        mrp: fullMrp ?? fullSelling,
        b2bPrice: fullB2b ?? fullSelling,
      } : null,
      small: null,
      medium: null,
      large: null,
    };

    if (portions.half) {
      variations.push({
        name: { en: "Half" },
        portionType: "half_full",
        price: portions.half.sellingPrice,
        sellingPrice: portions.half.sellingPrice,
        mrp: portions.half.mrp,
        b2bPrice: portions.half.b2bPrice,
      });
    }
    if (portions.full) {
      variations.push({
        name: { en: "Full" },
        portionType: "half_full",
        price: portions.full.sellingPrice,
        sellingPrice: portions.full.sellingPrice,
        mrp: portions.full.mrp,
        b2bPrice: portions.full.b2bPrice,
      });
    }

    // Effective primary price is Full plate, or Half plate
    const primaryPortion = portions.full || portions.half;
    const finalSellingPrice = primaryPortion ? primaryPortion.sellingPrice : fallbackSelling;
    const finalMrp = primaryPortion ? primaryPortion.mrp : fallbackMrp;
    const finalB2b = primaryPortion ? primaryPortion.b2bPrice : fallbackB2b;

    return {
      portionType,
      portions,
      variations,
      sellingPrice: finalSellingPrice,
      mrp: finalMrp,
      b2bPrice: finalB2b,
      addOns: normalizeAddOns(item.addOns),
    };
  }

  if (rawPortionType === "size" || (!rawPortionType && hasSizeData)) {
    portionType = "size";
    portions = {
      half: null,
      full: null,
      small: smallSelling !== null ? {
        sellingPrice: smallSelling,
        mrp: smallMrp ?? smallSelling,
        b2bPrice: smallB2b ?? smallSelling,
      } : null,
      medium: medSelling !== null ? {
        sellingPrice: medSelling,
        mrp: medMrp ?? medSelling,
        b2bPrice: medB2b ?? medSelling,
      } : null,
      large: largeSelling !== null ? {
        sellingPrice: largeSelling,
        mrp: largeMrp ?? largeSelling,
        b2bPrice: largeB2b ?? largeSelling,
      } : null,
    };

    if (portions.small) {
      variations.push({
        name: { en: "Small" },
        portionType: "size",
        price: portions.small.sellingPrice,
        sellingPrice: portions.small.sellingPrice,
        mrp: portions.small.mrp,
        b2bPrice: portions.small.b2bPrice,
      });
    }
    if (portions.medium) {
      variations.push({
        name: { en: "Medium" },
        portionType: "size",
        price: portions.medium.sellingPrice,
        sellingPrice: portions.medium.sellingPrice,
        mrp: portions.medium.mrp,
        b2bPrice: portions.medium.b2bPrice,
      });
    }
    if (portions.large) {
      variations.push({
        name: { en: "Large" },
        portionType: "size",
        price: portions.large.sellingPrice,
        sellingPrice: portions.large.sellingPrice,
        mrp: portions.large.mrp,
        b2bPrice: portions.large.b2bPrice,
      });
    }

    const primaryPortion = portions.small || portions.medium || portions.large;
    const finalSellingPrice = primaryPortion ? primaryPortion.sellingPrice : fallbackSelling;
    const finalMrp = primaryPortion ? primaryPortion.mrp : fallbackMrp;
    const finalB2b = primaryPortion ? primaryPortion.b2bPrice : fallbackB2b;

    return {
      portionType,
      portions,
      variations,
      sellingPrice: finalSellingPrice,
      mrp: finalMrp,
      b2bPrice: finalB2b,
      addOns: normalizeAddOns(item.addOns),
    };
  }

  // Handle custom variations or standard single pricing
  if (rawVariants.length > 0) {
    variations = rawVariants.map((v) => {
      if (!v) return null;
      let nameEn = "";
      if (typeof v === "string") nameEn = v.trim();
      else if (typeof v.name === "string") nameEn = v.name.trim();
      else if (v.name && typeof v.name === "object") {
        nameEn = (v.name.en || v.name.de || v.name.ar || Object.values(v.name)[0] || "").trim();
      }
      if (!nameEn) return null;

      const vSell = parseNumberOrNull(v.sellingPrice ?? v.price) ?? fallbackSelling;
      const vMrp = parseNumberOrNull(v.mrp ?? vSell) ?? vSell;
      const vB2b = parseNumberOrNull(v.b2bPrice ?? vSell) ?? vSell;
      return {
        name: { en: nameEn },
        portionType: "custom",
        price: vSell,
        sellingPrice: vSell,
        mrp: vMrp,
        b2bPrice: vB2b,
      };
    }).filter(Boolean);
  }

  return {
    portionType: variations.length > 0 ? "custom" : "none",
    portions: null,
    variations,
    sellingPrice: fallbackSelling,
    mrp: fallbackMrp,
    b2bPrice: fallbackB2b,
    addOns: normalizeAddOns(item.addOns),
  };
}

module.exports = {
  parseNumberOrNull,
  normalizeAddOns,
  normalizePortionsAndVariations,
};
