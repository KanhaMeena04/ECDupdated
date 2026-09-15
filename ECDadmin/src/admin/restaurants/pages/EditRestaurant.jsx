import PageActionBar from "../../components/PageActionBar";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import EditRestaurantForm from "../components/EditRestaurantForm";
export default function AddRestaurantsList() {
	const navigate=useNavigate()
  return (
 <div className="w-full  lg:mt-0 p-4 xs:p-5">
	<PageHeader
			title="Restaurant List"
			breadcrumbs={[{ label: "Restaurant List" }, { label: "Restaurants", active: true }]}
		  />
	 <PageActionBar
			  buttonLabel="Add Restaurant"    // CHANGED from actionLabel
			  onButtonClick={() => navigate("/add-restaurants")} // CHANGED from onActionClick
			  searchLabel="Search"
	  // searchValue={query}             // UNCOMMENTED
	  // onSearchChange={setQuery}       // UNCOMMENTED
	/>

	<EditRestaurantForm/>
  
</div>

 
  );
}
