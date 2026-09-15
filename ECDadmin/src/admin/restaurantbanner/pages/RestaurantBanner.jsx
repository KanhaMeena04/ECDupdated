import React from 'react'
import PageHeader from '../../components/PageHeader'
import PageActionBar from '../../components/PageActionBar'
import RestaurantBannerTable from '../components/RestaurantBannerTable'
import { useNavigate } from 'react-router-dom'
function RestaurantBanner() {
	const navigate=useNavigate()
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Banner List"
	  breadcrumbs={[
		{ label: "Banner" },
		{ label: "Banner List", active: true }
	  ]}
	/>
	
	
		<PageActionBar
				  buttonLabel="Add Banner"   
				  onButtonClick={() => navigate("/add-restaurant-banner")} 
				  searchLabel="Search"
		  // searchValue={query}         
		  // onSearchChange={setQuery}    
		/>		
	  
	<RestaurantBannerTable/>
	</div>
  )
}

export default RestaurantBanner