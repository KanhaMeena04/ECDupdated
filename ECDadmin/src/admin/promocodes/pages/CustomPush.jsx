import React from 'react'
import PageHeader from '../../components/PageHeader'
import CustomPushForm from '../components/CustomPushForm'
function CustomPush() {
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
					<PageHeader
				  title="Custom push"
				  breadcrumbs={[
					{ label: "promocode" },
					{ label: "Push Notification", active: true }
				  ]}
				/>
				<CustomPushForm/>
				</div>
  )
}

export default CustomPush