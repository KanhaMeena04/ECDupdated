import React from 'react'
import PageHeader from '../../components/PageHeader'
import AdminCustomPushForm from '../components/AdminCustomPushForm'
function AdminCutomPush() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
				<PageHeader
			  title="Admin Custompush"
			  breadcrumbs={[
				{ label: "promocode" },
				{ label: "Admin Cutompush", active: true }
			  ]}
			/>
			<AdminCustomPushForm/>
			</div>
  )
}

export default AdminCutomPush