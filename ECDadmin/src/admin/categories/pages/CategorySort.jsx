import PageHeader from "../../components/PageHeader"
import SortCategoryUI from "../components/SortCategoryUi"
function CategorySort() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
			   <PageHeader
						title="Sort Category"
						breadcrumbs={[
						  { label: "Category" },
						  { label: "Sort Category ", active: true }
						]}
						/>
	          <SortCategoryUI/>
		</div>
  )
}

export default CategorySort