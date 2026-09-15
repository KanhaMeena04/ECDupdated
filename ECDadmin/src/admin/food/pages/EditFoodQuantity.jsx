import React from 'react'
import PageHeader from '../../components/PageHeader'

function EditFoodQuantity() {
  return (
	<div className="p-8 bg-white shadow-sm rounded-md min-h-screen">
		<PageHeader
					   title=" Add Food Quantity "
					   breadcrumbs={[
						 { label: "Add Food Quantity " },
						 { label: "Food Quantity ", active: true }
					   ]}
					   />
						
   
	 
	</div>
  )
}

export default EditFoodQuantity