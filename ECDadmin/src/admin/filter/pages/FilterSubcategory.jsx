import React from 'react'
import PageHeader from '../../components/PageHeader'
import FilterSubCategoryTable from '../components/FilterSubCategoryTable'
import PageActionBar from '../../components/PageActionBar'
import { useNavigate } from 'react-router-dom'
function FilterSubcategory() {
	const navigate=useNavigate()
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
					<PageHeader
				  title="Filter Subcategory List"
				  breadcrumbs={[
					{ label: "Filter Subcategory List" },
					{ label: "Filter Subcategory List", active: true }
				  ]}
				/>
				<PageActionBar
				buttonLabel='Add  Filter Sub Category'
				onButtonClick={()=>navigate("/filter-add-sub-category")}
				/>
				<FilterSubCategoryTable/>
				
				</div>
  )
}

export default FilterSubcategory