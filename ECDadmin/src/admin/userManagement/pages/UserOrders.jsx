import React from 'react';
import UserOrderHistoryTable from '../components/UserOrdersHistoryTable.jsx';
import { useParams } from 'react-router-dom';

function UserOrders() {
  const params = useParams();
  const userId = params?.id || params?.userId;

  return (
    <div>
      <UserOrderHistoryTable userId={userId} />
    </div>
  );
}

export default UserOrders;
