import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import EditPromocodeForm from "../components/EditPromocodeForm";

export default function PromocodeList() {
  return (
	<div className="bg-white border rounded-lg p-6">
	  <PageHeader
		title="Promocode List"
		breadcrumbs={[
		  { label: "Promocodes" },
		  { label: "Promocodes List", active: true },
		]}
	  />
	  <EditPromocodeForm/>

	</div>
  );
}
