import StatsCards from "../components/StatsCards";
import TodayOrdersCard from "../components/TodayOrdersCard";
import RecentOrders from "../components/RecentOrders";

export default function Dashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-gradient-to-t from-gray-100 to-gray-50 md:p-8">
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayOrdersCard />
        <RecentOrders />
      </div>
    </div>
  );
}
