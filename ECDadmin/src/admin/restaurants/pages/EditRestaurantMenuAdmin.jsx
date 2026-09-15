import PageHeader from "../../components/PageHeader";
import EditRestaurantMenuForm from "../components/EditRestaurantMenuForm";

const EditRestaurantMenuAdmin = () => {


  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <PageHeader
        title="Restaurant Menu"
        breadcrumbs={[
          { label: "Restaurants" },
          { label: "Menu", active: true },
        ]}
      />
    <EditRestaurantMenuForm/>
    </div>
  );
};

export default EditRestaurantMenuAdmin;
