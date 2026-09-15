
import {
  AccessTime,
  Warning,
} from "@mui/icons-material";
import {useOrderDashboard} from "../../api/order";

const iconMap = {
  failed: Warning,
  processing: AccessTime,
};

export default function RecentOrders() {
  const { recentOrders } = useOrderDashboard();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 h-full">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-700">
          Recent Orders
        </h3>
      </div>

      <div className="divide-y">
        {recentOrders.map((order) => {
          const Icon = iconMap[order.statusType];

          return (
            <div
              key={order.id}
              className="flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon className={order.color} fontSize="small" />
                </div>

                <div>
                  <p className="font-medium text-gray-700">
                    {order.id}
                  </p>
                  <p className="text-sm text-gray-400">
                    {order.status}
                  </p>
                </div>
              </div>

              <p className={`font-semibold ${order.color}`}>
                {order.amount}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
