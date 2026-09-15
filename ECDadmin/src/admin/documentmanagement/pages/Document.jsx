import React from 'react'
import PageHeader from "../../components/PageHeader"
import PageActionBar from '../../components/PageActionBar'
import { useNavigate } from 'react-router-dom'
import DocumentTable from '../components/DocumentTable'
function Document() {
	const navigate=useNavigate()
  return (
	 <div className="w-full  lg:mt-0 p-4 xs:p-5">
		<PageHeader
	  title="Document List"
	  breadcrumbs={[
		{ label: "Document List" },
		{ label: "Document", active: true }
	  ]}
	/>
	
	
		<PageActionBar
				  buttonLabel="Add Document"   
				  onButtonClick={() => navigate("/add-document")} 
				  searchLabel="Search"
		  // searchValue={query}         
		  // onSearchChange={setQuery}    
		/>

		<DocumentTable/>
		
	  
	
	</div>
  )
}

export default Document