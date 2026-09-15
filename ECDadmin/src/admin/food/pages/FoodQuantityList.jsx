import React ,{useState}from 'react'
import PageHeader from '../../components/PageHeader';
import PageActionBar from '../../components/PageActionBar';
import FoodQuantityTable from '../components/FoodQuantityTable';
import { useNavigate } from 'react-router-dom';
function FoodQuantityList() {

   const navigate=useNavigate()
 
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			<PageHeader
			   title="Food Quantity List"
			   breadcrumbs={[
				 { label: "Food Quantity List" },
				 { label: "Food Quantity List", active: true }
			   ]}
			   />
			    <PageActionBar
				  buttonLabel="Add Food Quantity"
				  onButtonClick={()=>navigate("/add-food-quantity")}
				  searchLabel="Search"
				//   searchValue={query}
				//   onSearchChange={setQuery}
				/>
        
			 <FoodQuantityTable/>
      
	  </div>
  )
}

export default FoodQuantityList