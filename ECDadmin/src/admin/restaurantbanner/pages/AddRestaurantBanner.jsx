import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddRestaurantBannerForm from '../components/AddRestaurantBannerForm'

function AddRestaurantBanner() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Banner List"
	  breadcrumbs={[
		{ label: "Banner" },
		{ label: "Banner List", active: true }
	  ]}
	/>
	<AddRestaurantBannerForm/>	
	  
	</div>
  )
}

export default AddRestaurantBanner