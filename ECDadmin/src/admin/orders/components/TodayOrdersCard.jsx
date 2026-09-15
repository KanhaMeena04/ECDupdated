// TodayOrdersCard.tsx

import {useOrderDashboard} from "../../api/order";

export default function TodayOrdersCard() {
  const { todayOrders } = useOrderDashboard();

  if (!todayOrders) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-500 h-full">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-700">
          Today Orders
        </h3>

        <div className="text-center mt-6">
          <p className="text-5xl font-semibold text-gray-800">
            {todayOrders.total}
          </p>
          <p className="text-sm text-gray-400 mt-1">Orders</p>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm font-medium text-gray-500">
            Completed Orders
          </p>
          <p className="text-2xl font-semibold text-gray-700 mt-2">
            {todayOrders.completedPercent}%
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
        {todayOrders.breakdown.map((item) => (
          <div key={item.label} className="p-4 text-center">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-xl font-semibold text-gray-800">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
