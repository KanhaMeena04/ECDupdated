import PageHeader from '../../components/PageHeader'
import AddCategoryForm from '../components/AddCategoryForm'
function AddCategory() {
  return (
		<div className="p-6 bg-gray-50 min-h-screen">
		   <PageHeader
					title="Add Category "
					breadcrumbs={[
					  { label: "Category" },
					  { label: "Add Category ", active: true }
					]}
					/>

					<AddCategoryForm/>
	</div>
  )
}

export default AddCategory