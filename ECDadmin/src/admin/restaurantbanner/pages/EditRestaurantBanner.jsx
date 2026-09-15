import React from 'react'
import EditRestaurantBannerForm from '../components/EditRestaurantBannerForm'
import PageHeader from '../../components/PageHeader'
function EditRestaurantBanner() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Edit Banner"
	  breadcrumbs={[
		{ label: "Banners" },
		{ label: "Edit Banner", active: true }
	  ]}
	/>
	
	<EditRestaurantBannerForm/>
	  
	</div>
  )
}

export default EditRestaurantBanner