import { useNavigate } from "react-router-dom";
import PageActionBar from "../../components/PageActionBar";
import PageHeader from "../../components/PageHeader";
import PromocodeTable from "../components/PromocodeTable";

export default function PromoCodesList() {
  const navigate=useNavigate()
  return (
    <div className="bg-white border rounded-lg p-6">
      <PageHeader
        title="Promocode List"
        breadcrumbs={[
          { label: "Promocodes" },
          { label: "Promocodes List", active: true },
        ]}
      />

      <PageActionBar
        buttonLabel="Add Promocode"
        onButtonClick={()=>navigate("/add-promocodes")}
        searchLabel="search"
      />

      <PromocodeTable />
    </div>
  );
}
