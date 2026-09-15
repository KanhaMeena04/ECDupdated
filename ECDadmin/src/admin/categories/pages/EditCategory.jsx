import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditCategoryForm from '../components/EditCategoryForm'

function EditCategory() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			   <PageHeader
						title="Edit Category"
						breadcrumbs={[
						  { label: "Category" },
						  { label: "Edit Category ", active: true }
						]}
						/>
						<EditCategoryForm/>
		</div>
  )
}

export default EditCategory