const RuleEngine = require('../models/RuleEngine');

/**
 * Evaluates a single rule condition against the supplied runtime context.
 */
function matchesCondition(actualValue, operator, expectedValue) {
  if (actualValue === undefined || actualValue === null) return false;
  const numActual = Number(actualValue);
  const numExpected = Number(expectedValue);
  const bothNumeric = !Number.isNaN(numActual) && !Number.isNaN(numExpected);

  switch (operator) {
    case '>':
      return bothNumeric && numActual > numExpected;
    case '>=':
      return bothNumeric && numActual >= numExpected;
    case '<':
      return bothNumeric && numActual < numExpected;
    case '<=':
      return bothNumeric && numActual <= numExpected;
    case '==':
      return bothNumeric
        ? numActual === numExpected
        : String(actualValue).toLowerCase() === String(expectedValue).toLowerCase();
    case '!=':
      return bothNumeric
        ? numActual !== numExpected
        : String(actualValue).toLowerCase() !== String(expectedValue).toLowerCase();
    case 'contains':
      return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
    default:
      return false;
  }
}

/**
 * Evaluates all active RuleEngine rules against the provided context.
 * Context keys supported:
 *  - orderValue, rainStatus, restaurantAcceptanceTime, cancellationRate,
 *    riderDistance, timeOfDay (hour 0-23), userOrderCount
 */
async function evaluateRules(context = {}) {
  const result = {
    matchedRules: [],
    overrideDeliveryFee: null,
    additionalDeliveryFee: 0,
    discountPercent: 0,
    discountFixed: 0,
    preventAssignment: false,
    alerts: [],
    warnings: []
  };

  try {
    const activeRules = await RuleEngine.find({ isActive: true }).sort({ priority: -1, createdAt: 1 }).lean();
    if (!activeRules || activeRules.length === 0) return result;

    const currentHour = new Date().getHours();
    const evalContext = {
      timeOfDay: currentHour,
      ...context
    };

    for (const rule of activeRules) {
      const actualVal = evalContext[rule.conditionField];
      if (!matchesCondition(actualVal, rule.operator, rule.value)) continue;

      result.matchedRules.push({
        id: rule._id,
        name: rule.name,
        actionType: rule.actionType,
        actionValue: rule.actionValue
      });

      const numericActionVal = Number(rule.actionValue) || 0;
      switch (rule.actionType) {
        case 'setDeliveryFee':
          result.overrideDeliveryFee = Math.max(0, numericActionVal);
          break;
        case 'addDeliveryFee':
          result.additionalDeliveryFee += numericActionVal;
          break;
        case 'applyDiscountPercent':
          result.discountPercent += numericActionVal;
          break;
        case 'applyDiscountFixed':
          result.discountFixed += numericActionVal;
          break;
        case 'preventAssignment':
          result.preventAssignment = Boolean(rule.actionValue !== false && rule.actionValue !== 'false');
          break;
        case 'triggerAdminAlert':
          result.alerts.push(String(rule.actionValue || rule.name));
          break;
        case 'issueRestaurantWarning':
          result.warnings.push(String(rule.actionValue || rule.name));
          break;
        default:
          break;
      }
    }
  } catch (err) {
    console.warn('[RuleEngine] Evaluation skipped:', err.message);
  }

  return result;
}

module.exports = { evaluateRules, matchesCondition };

