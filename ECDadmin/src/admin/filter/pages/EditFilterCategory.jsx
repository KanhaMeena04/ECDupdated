import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditFilterCategoryForm from '../components/EditFilterCategoryForm'

function EditFilterCategory() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
						<PageHeader
					  title="Edit Filter "
					  breadcrumbs={[
						{ label: "Edit Filter" },
						{ label: "Filter", active: true }
					  ]}
					/>
					<EditFilterCategoryForm/>
					</div>
  )
}

export default EditFilterCategory