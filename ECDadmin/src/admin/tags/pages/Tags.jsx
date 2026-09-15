import React from 'react'
import PageHeader from '../../components/PageHeader'
import PageActionBar from '../../components/PageActionBar'
import TagsTable from '../components/TagsTable'
import { useNavigate } from 'react-router-dom'
function Tags() {
	const navigate=useNavigate()
  return (
	<div className="w-full  lg:mt-0 p-4 xs:p-5">
			<PageHeader
		  title="Tags"
		  breadcrumbs={[
			{ label: "Tags" },
			{ label: "Tags List", active: true }
		  ]}
		/>
		
		
			<PageActionBar
					  buttonLabel="Add Tag"   
					  onButtonClick={() => navigate("/add-document")} 
					  searchLabel="Search"
			  // searchValue={query}         
			  // onSearchChange={setQuery}    
			/>
	
			<TagsTable/>
		  
		
		</div>
  )
}

export default Tags