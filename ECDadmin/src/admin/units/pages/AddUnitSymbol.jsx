import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddUnitSymbolForm from '../components/AddUnitSymbolForm'

function AddUnitSymbol() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			   <PageHeader
						title="Units Symbol "
						breadcrumbs={[
						  { label: "Units Symbol" },
						  { label: "Add Unit", active: true }
						]}
						/>
				<AddUnitSymbolForm/>
						 
		</div>
  )
}

export default AddUnitSymbol