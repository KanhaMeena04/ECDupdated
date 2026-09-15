// StatsCards.tsx
import {
  CheckCircle,
  Cancel,
  AccessTime,
  EventNote,
} from "@mui/icons-material";
import {useOrderDashboard} from "../../api/order";

const iconMap = {
  today: EventNote,
  completed: CheckCircle,
  cancelled: Cancel,
  processing: AccessTime,
};

export default function StatsCards() {
  const { stats } = useOrderDashboard();

  return (
    <div className="stats-cards-wrapper sm:mt-12 md:mt-0 border bg-white rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = iconMap[item.type];

          return (
            <div key={item.label}>
              <div className="flex items-center gap-4 p-5">
                <div
                  className={`w-12 h-12 flex items-center justify-center ${item.bg}`}
                >
                  <Icon className={item.color} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {item.value}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
