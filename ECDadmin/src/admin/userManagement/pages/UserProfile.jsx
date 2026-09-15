import React from 'react'
import PageHeader from '../../components/PageHeader'
import UserDetail from '../components/UserDetails'
function UserProfile() {
  return (
	<>
	<div className="p-6 bg-gray-50 min-h-screen">
			<PageHeader
		    	title="User Detail "
		    	breadcrumbs={[
		    	  { label: "User Management" },
		    	  { label: "users", active: true }
		    	]}
			/>
			<UserDetail/>
		</div>
 

	</>
  )
}

export default UserProfile