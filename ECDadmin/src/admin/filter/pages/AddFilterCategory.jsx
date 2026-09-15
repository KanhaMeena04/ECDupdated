import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddFilterCategoryForm from '../components/AddFilterCategoryForm'

function AddFilterCategory() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
						<PageHeader
					  title="Add Filter "
					  breadcrumbs={[
						{ label: "Add Filter" },
						{ label: "Filter ", active: true }
					  ]}
					/>
					<AddFilterCategoryForm/>
					</div>
  )
}

export default AddFilterCategory