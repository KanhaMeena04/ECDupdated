import React from 'react'
import PageHeader from '../../components/PageHeader'
import FilterCategoryTable from '../components/FilterCategoryTable'
import PageActionBar from '../../components/PageActionBar'
import { useNavigate } from 'react-router-dom'
function FilterCategoryList() {
	const navigate=useNavigate()
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
					<PageHeader
				  title="Filter  List"
				  breadcrumbs={[
					{ label: "Filter  List" },
					{ label: "Filter List", active: true }
				  ]}
				/>
				<PageActionBar
				buttonLabel='Add Filter Category'
				onButtonClick={()=>navigate("/filter-add-category")}
				/>
				<FilterCategoryTable/>
				</div>
  )
}

export default FilterCategoryList