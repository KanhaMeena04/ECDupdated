import React from 'react'
import PageHeader from '../../components/PageHeader'
import PageActionBar from '../../components/PageActionBar'
import GroupDashboard from '../components/GroupDashboard'
import { useNavigate } from 'react-router-dom'
function GroupList() {
	const navigate=useNavigate()
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
		 <PageHeader
			title="Groups "
			breadcrumbs={[
			  { label: "Groups" },
			  { label: "Groups List", active: true }
			]}
			/>
			  <PageActionBar
				  buttonLabel="Add Group"
				  onButtonClick={()=>navigate("/add-group")}
				  searchLabel="Search"
				//   searchValue={query}
				//   onSearchChange={setQuery}
				/>
				<GroupDashboard/>
			</div>
  )
}

export default GroupList