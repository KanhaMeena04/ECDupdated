import React from 'react'
import PageActionBar from '../../components/PageActionBar'
import PageHeader from '../../components/PageHeader'
import GroupTagDashboard from '../components/GroupTagDashboard'
import { useNavigate } from 'react-router-dom'
function GroupTagsList() {
	const navigate=useNavigate()
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
		 <PageHeader
			title="Group Tags"
			breadcrumbs={[
			  { label: "Group" },
			  { label: "Group Tags", active: true }
			]}
			/>
			  <PageActionBar
				  buttonLabel="Add Group Tag"
				 onButtonClick={()=>navigate("/add-group-tag")}
				  searchLabel="Search"
				//   searchValue={query}
				//   onSearchChange={setQuery}
				/>
			<GroupTagDashboard/>

			</div>
			
  )

}
export default GroupTagsList