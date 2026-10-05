import React from "react";
import {
  AccessTime,
  CheckCircle,
  Warning,
  OpenInNew,
  Storefront,
  Person,
  PedalBike,
  ShoppingBag,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useOrderDashboard } from "../../api/order";

const iconMap = {
  failed: Warning,
  completed: CheckCircle,
  processing: AccessTime,
};

const formatName = (val, fallback = "") => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.en || val.hi || val.name || val.title || (Object.values(val).find(v => typeof v === 'string') || fallback);
  }
  return String(val);
};

export default function RecentOrders({ recentOrders: propRecentOrders }) {
  const navigate = useNavigate();
  const { recentOrders: apiRecentOrders } = useOrderDashboard();
  const recentOrders = propRecentOrders || apiRecentOrders;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-800">
            Recent Orders
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Auto-updates every 5s
        </span>
      </div>

      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {!recentOrders || recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm font-medium">No recent orders found</p>
          </div>
        ) : (
          recentOrders.map((order) => {
            const Icon = iconMap[order.statusType] || AccessTime;
            const restaurantTitle = formatName(order.restaurantName || order.restaurant?.name || order.restaurant, "Restaurant");
            const customerTitle = formatName(order.customerName || order.customer?.name || order.customer, "Customer");
            const isPickup = order.orderType === "self_pickup";

            return (
              <div
                key={order._id || order.id}
                onClick={() => navigate(`/view-order/${order._id || order.id.replace('#', '')}`)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                title="Click to view live order details"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    order.statusType === 'completed'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : order.statusType === 'failed'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    <Icon fontSize="small" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm tracking-wide">
                        {formatName(order.orderCode || order.id)}
                      </span>

                      {/* Prominent Restaurant Name Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 truncate max-w-[200px]">
                        <Storefront sx={{ fontSize: 13 }} />
                        {formatName(restaurantTitle, "Restaurant")}
                      </span>

                      {/* Order Type Badge */}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                        {isPickup ? (
                          <>
                            <ShoppingBag sx={{ fontSize: 11 }} /> Pickup
                          </>
                        ) : (
                          <>
                            <PedalBike sx={{ fontSize: 11 }} /> Delivery
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 truncate max-w-[120px]">
                        <Person sx={{ fontSize: 13 }} className="text-gray-400" />
                        {formatName(customerTitle, "Customer")}
                      </span>
                      <span>•</span>
                      <span className={`font-semibold capitalize ${
                        order.statusType === 'completed'
                          ? 'text-emerald-600'
                          : order.statusType === 'failed'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}>
                        {formatName(order.status, "Processing")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">
                      {formatName(order.inrAmount || order.amount, "₹0.00")}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/view-order/${order._id || order.id.replace('#', '')}`);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all border border-transparent group-hover:border-emerald-200"
                    title="View live order"
                  >
                    <OpenInNew sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
