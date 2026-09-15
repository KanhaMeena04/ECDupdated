import React from 'react'
import PageHeader from '../../components/PageHeader'
import RestaurantApplicationForm from '../components/RestaurantApplicationForm'

function ApplyForRestaurant() {
  return (
	 <div className="w-full lg:mt-0 p-4 xs:p-5">
		  <PageHeader
			title="Apply For Restaurant"
			breadcrumbs={[
			  { label: "Apply For Restaurant " },
			  { label: "Restaurants", active: true },
			]}
		  />
	
		<RestaurantApplicationForm/>
		 
		</div>
  )
}

export default ApplyForRestaurant