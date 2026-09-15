import { useState } from "react";
import PageHeader from "../../components/PageHeader";
import AddVehicleForm from "../components/AddVehicleForm";
export default function AddVehicle() {

  return (
    <div className="p-6">
     <PageHeader
			   title=" Add Vehicles"
			   breadcrumbs={[
				 { label: "Vehicles" },
				 { label: "Add Vehicle", active: true }
			   ]}
			   />
      
     <AddVehicleForm/>
    </div>
  );
}
