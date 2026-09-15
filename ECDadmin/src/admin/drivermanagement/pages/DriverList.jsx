
import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import DriverTable from "../components/DriverTable";
import { useNavigate } from "react-router-dom";


export default function DriverList() {
  const navigate=useNavigate()
  return (
    <div className="w-full bg-white p-6 rounded-lg border">
      	   <PageHeader
						title="Driver List"
						breadcrumbs={[
						  { label: "Driver List " },
						  { label: "Driver", active: true }
						]}
						/>
     
    <PageActionBar
                     buttonLabel="Add Driver"   
                     onButtonClick={() => navigate("/admin-create-driver")} 
                     searchLabel="Search"
               />
     <DriverTable/>
      
    </div>
  );
}
