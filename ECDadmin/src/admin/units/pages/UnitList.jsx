import React from 'react'
import PageActionBar from '../../components/PageActionBar'
import PageHeader from '../../components/PageHeader'
import UnitSymbolAdd from '../components/UnitSymbolTable'
import { useNavigate } from 'react-router-dom'
function UnitList() {
	const navigate = useNavigate();
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			   <PageHeader
						title="Units "
						breadcrumbs={[
						  { label: "Units" },
						  { label: "Unit List", active: true }
						]}
						/>
	
							 
								<PageActionBar
												 buttonLabel="Add Unit"   
												 onButtonClick={() => navigate("/add-unit")} 
												   showSearch = {false}

										   />
								 
							<UnitSymbolAdd/>
		</div>
  )
}

export default UnitList