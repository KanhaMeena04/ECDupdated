import React from 'react'
import PageHeader from '../../components/PageHeader'
import AddonForm from '../components/AddonForm'

export default function AddAddon() {
	  return (
		<div className="p-6 bg-gray-50 min-h-screen">
	 <PageHeader
		title="Add Addons "
		breadcrumbs={[
		  { label: "Addons" },
		  { label: "Add Addons ", active: true }
		]}
		/>
		<AddonForm/>
		 
		</div>
	  )
	}
