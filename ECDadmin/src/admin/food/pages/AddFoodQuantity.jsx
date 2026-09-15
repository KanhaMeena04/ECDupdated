import PageHeader from '../../components/PageHeader';
import AddFoodQuantityForm from '../components/AddFoodQuantityForm';

const AddCategoryForm = () => {
  
  return (
	<div className="p-8 bg-white shadow-sm rounded-md min-h-screen">
		<PageHeader
					   title=" Add Food Quantity "
					   breadcrumbs={[
						 { label: "Add Food Quantity " },
						 { label: "Food Quantity ", active: true }
					   ]}
					   />
						
     <AddFoodQuantityForm/>
	 
	</div>
  );
};

export default AddCategoryForm;