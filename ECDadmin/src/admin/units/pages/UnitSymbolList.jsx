import React from 'react'
import PageHeader from '../../components/PageHeader'
import PageActionBar from '../../components/PageActionBar'
import UnitSymbolTable from '../components/UnitSymbolTable'
import { useNavigate } from 'react-router-dom'
function UnitSymbolList() {
	const navigate=useNavigate()
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			   <PageHeader
						title="Unit Symbol "
						breadcrumbs={[
						  { label: "Unit Symbol" },
						  { label: "Unit Symbol", active: true }
						]}
						/>
						  <PageActionBar
							  buttonLabel="Add Unit Symbol"
							  onButtonClick={()=>navigate("/unit-symbol")}
							  searchLabel="Search"
							//   searchValue={query}
							//   onSearchChange={setQuery}
							/>
							<UnitSymbolTable/>
		</div>
  )
}

export default UnitSymbolList