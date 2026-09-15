import React from 'react';
import PayoutTable from '../payout/components/PayoutTable';
import { Star } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useReviews } from '../api/review';

const ServiceRatings = () => {
  const { reviews, loading, error } = useReviews();

  const renderRating = (params) => {
    const rating = parseFloat(params.value) || 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex text-orange-400">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < Math.floor(rating) ? "currentColor" : "none"}
              strokeWidth={i < Math.floor(rating) ? 0 : 2}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-gray-600">
          {rating.toFixed(2)}
        </span>
      </div>
    );
  };

  const columns = [
    { field: 'id', headerName: '', width: 50 },
    { field: 'orderId', headerName: 'Order Id', flex: 0.8 },
    { field: 'userName', headerName: 'User Name', flex: 1 },
    { field: 'restaurantName', headerName: 'Restaurant Name', flex: 1.2 },
    {
      field: 'restaurantRating',
      headerName: 'Restaurant Rating',
      flex: 1.2,
      renderCell: renderRating
    },
    { field: 'deliveryBoyName', headerName: 'Delivery Boy Name', flex: 1 },
    {
      field: 'deliveryBoyRating',
      headerName: 'Delivery Boy Rating',
      flex: 1.2,
      renderCell: renderRating
    },
    { field: 'feedback', headerName: 'Feedback', flex: 1 },
  ];

  const noDataMessage = !loading && !error && reviews.length === 0
    ? "No reviews available."
    : null;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <PageHeader
        title="Reviews"
        breadcrumbs={[{ label: "Reviews and Ratings", active: true }]}
      />

      <PayoutTable
        data={reviews}
        columns={columns}
        title="Service Ratings"
        searchPlaceholder="Search order or user..."
      />

      {loading && <p className="text-sm text-gray-400 mt-2">Loading reviews…</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      {noDataMessage && <p className="text-sm text-gray-500 mt-2">{noDataMessage}</p>}
    </div>
  );
};

export default ServiceRatings;
