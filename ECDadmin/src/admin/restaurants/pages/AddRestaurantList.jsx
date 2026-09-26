import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AddRestaurantForm from "../components/AddRestaurantForm";
import PageHeader from "../../components/PageHeader";
export default function AddRestaurantsList() {
  return (
	 <div className="w-full  lg:mt-0 p-2 xs:p-5">
		<PageHeader
	  title="Add New Restaurant Partner"
	  breadcrumbs={[
		{ label: "Restaurants" },
		{ label: "Add Restaurant", active: true }
	  ]}
	/>
	
	
	

	<div className="flex items-center  ">

	 </div>
	 <AddRestaurantForm/>
  
</div>

 
  );
}

