import React from 'react'
import PageHeader from '../../components/PageHeader'
import UpdateLocationCard from '../components/LiveLocation'
function DriverLiveLocation() {
  return (
	 <div className="w-full bg-white p-6 rounded-lg border">
			   <PageHeader
							title="Driver Live Location"
							breadcrumbs={[
							  { label: "Driver Live Location " },
							  { label: "Driver", active: true }
							]}
				/>
			<UpdateLocationCard/>
							
	</div>
  )
}

export default DriverLiveLocation