import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddUnitForm from '../components/AddUnitForm'
function AddUnit() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			<PageHeader
		    	title="Units "
		    	breadcrumbs={[
		    	  { label: "Units" },
		    	  { label: "Add Unit", active: true }
		    	]}
			/>
			<AddUnitForm/>
		</div>
  )
}

export default AddUnit