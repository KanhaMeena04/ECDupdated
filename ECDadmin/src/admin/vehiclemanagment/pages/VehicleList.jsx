import PageHeader from "../../components/PageHeader";
import VehicleTable from "../components/VehicleTabel";
import PageActionBar from "../../components/PageActionBar";
import { useNavigate } from "react-router-dom";


export default function VehicleList() {
  const navigate=useNavigate()
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
       <PageHeader
          title="Vehicles List"
          breadcrumbs={[
            { label: "Vehicles List" },
            { label: "Vehicles", active: true }
          ]}
          />
          <PageActionBar
          buttonLabel="Add Vehicle"
          onButtonClick={()=>navigate("/add-vehicle")}
          />
          <VehicleTable/>
      

     
    </div>
  );
}
