import React from 'react'
import PageHeader from '../../components/PageHeader'
import FilterSortTable from '../components/FilterSortTable'
function FilterCategorySort() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
					<PageHeader
				  title="Filter Subcategory List"
				  breadcrumbs={[
					{ label: "Filter Subcategory List" },
					{ label: "Filter Subcategory List", active: true }
				  ]}
				/>
				<FilterSortTable/>
				</div>
  )
}

export default FilterCategorySort