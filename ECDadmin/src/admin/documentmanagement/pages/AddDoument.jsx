import React from 'react'
import AddDocumentForm from '../components/AddDocumentForm'
import PageHeader from '../../components/PageHeader'
function AddDoument() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Add Document"
	  breadcrumbs={[
		{ label: "Document" },
		{ label: "Add Document", active: true }
	  ]}
	/>
	<AddDocumentForm/>
	</div>
  )
}

export default AddDoument