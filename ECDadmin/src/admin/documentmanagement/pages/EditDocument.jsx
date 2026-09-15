import React from 'react'
import PageHeader from '../../components/PageHeader'
import EditDocumentForm from '../components/EditDocumentForm'
function EditDocument() {
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
			<PageHeader
		  title="Add Document"
		  breadcrumbs={[
			{ label: "Document" },
			{ label: "Add Document", active: true }
		  ]}
		/>
		<EditDocumentForm/>
	</div>
  )
}

export default EditDocument