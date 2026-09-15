import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import { useNavigate } from "react-router-dom";
import PendingRiderTable from "../components/PendingRiderTable";

export default function PendingDriverList() {
	const navigate = useNavigate()
  return (
	<div className="bg-white border rounded-lg p-6 w-full">
	  <PageHeader
							title="Pending Driver "
							breadcrumbs={[
							  { label: "Pending Driver " },
							  { label: "Driver", active: true }
							]}
							/>
			
		 	<PageActionBar
			 buttonLabel="Add Driver"   
			 onButtonClick={() => navigate("/add-driver")} 
			 searchLabel="Search"
			   />

	  <PendingRiderTable/>
	</div>
  );
}
