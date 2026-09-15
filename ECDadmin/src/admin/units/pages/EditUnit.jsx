import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditUnitForm from '../components/EditUnitForm'

function EditUnit() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
				   <PageHeader
							title="Units "
							breadcrumbs={[
							  { label: "Units" },
							  { label: "Edit Unit ", active: true }
							]}
							/>

							<EditUnitForm/>
	</div>
  )
}

export default EditUnit