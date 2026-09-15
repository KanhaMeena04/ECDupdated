import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import { useNavigate } from "react-router-dom";
import ZoneTable from "../components/ZoneTable";

export default function ZoneList() {
  const navigate=useNavigate()
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
       <PageHeader
			title="Zone List"
			breadcrumbs={[
			  { label: "Zones" },
			  { label: "Zone List", active: true }
			]}
		  />
      <PageActionBar
      buttonLabel="Add Zone"
      onButtonClick={()=>navigate("/add-zone")}
      />
      
     <ZoneTable/>

      
    </div>
  );
}
