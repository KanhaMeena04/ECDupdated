import React from 'react'
import PageActionBar from '../../components/PageActionBar'
import PageHeader from '../../components/PageHeader'
import CategoryTable from '../components/CategoryTable'
import { useNavigate } from 'react-router-dom'
function CategoryList() {
	const navigate=useNavigate()
  return (
		<div className="p-6 bg-gray-50 min-h-screen">
		   <PageHeader
					title="Category List"
					breadcrumbs={[
					  { label: "Category" },
					  { label: "Category List", active: true }
					]}
					/>
	<PageActionBar
  buttonLabel="Add Category"
  onButtonClick={() => navigate("/add-category")}
  searchLabel="Search"
/>
	<CategoryTable/>
	</div>
  )
}

export default CategoryList