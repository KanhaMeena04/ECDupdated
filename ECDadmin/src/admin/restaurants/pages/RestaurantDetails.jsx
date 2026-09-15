import React from 'react'
import PageHeader from '../../components/PageHeader'
import RestaurantDetailsTable from '../components/RestaurantDetailsTable'

function RestaurantDetails() {
  return (
 <div className="w-full lg:mt-0 p-4 xs:p-5">
	  <PageHeader
		title="Restaurant Details"
		breadcrumbs={[
		  { label: "Restaurant Details" },
		  { label: "Restaurants", active: true },
		]}
	  />
      <RestaurantDetailsTable/>
	  

	</div>
  )
}

export default RestaurantDetails