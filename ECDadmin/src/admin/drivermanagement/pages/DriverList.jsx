import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import DriverTable from "../components/DriverTable";
import { useNavigate } from "react-router-dom";

export default function DriverList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full bg-white p-6 rounded-lg border">
      <PageHeader
        title="Rider List"
        breadcrumbs={[
          { label: "Rider List" },
          { label: "Rider", active: true }
        ]}
      />
     
      <PageActionBar
        buttonLabel="Add Rider"   
        onButtonClick={() => navigate("/admin-create-driver")} 
        searchLabel="Riders"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <DriverTable searchQuery={searchQuery} />
    </div>
  );
}
