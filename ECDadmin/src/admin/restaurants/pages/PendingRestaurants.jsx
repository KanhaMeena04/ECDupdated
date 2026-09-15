import React from 'react'
import PageHeader from '../../components/PageHeader'
import PendingRestaurantTable from '../components/PendingRestaurantTable'
function PendingRestaurants() {
  return (
      <div className="w-full lg:mt-0 p-4 xs:p-5">
          <PageHeader
            title="Pending Restaurants List"
            breadcrumbs={[
              { label: "Pending Restaurants List" },
              { label: "Restaurants", active: true },
            ]}
          />
    
          <PendingRestaurantTable/>
    
          
        </div>
  )
}

export default PendingRestaurants