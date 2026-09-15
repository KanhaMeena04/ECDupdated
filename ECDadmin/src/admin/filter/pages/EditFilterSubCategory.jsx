import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditFilterSubCategoryForm from '../components/EditFilterSubCategoryForm'

function EditFilterSubCategory() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
					<PageHeader
				  title="Edit Filter Sub Category"
				  breadcrumbs={[
					{ label: "Edit Filter Sub Category" },
					{ label: "Filter ", active: true }
				  ]}
				/>
				<EditFilterSubCategoryForm/>
				</div>
  )
}

export default EditFilterSubCategory