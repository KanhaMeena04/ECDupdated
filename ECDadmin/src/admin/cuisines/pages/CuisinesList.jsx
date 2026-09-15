import PageHeader from '../../components/PageHeader';
import PageActionBar from '../../components/PageActionBar';
import CuisineList from '../components/CuisinesList';
import { useNavigate } from 'react-router-dom';

function CuisinesList() {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Cuisines List"
        breadcrumbs={[
          { label: "Cuisines" },
          { label: "Cuisines List", active: true }
        ]}
      />

      <PageActionBar
        buttonLabel="Add Cuisine"
        onButtonClick={() => navigate("/add-cuisine")}
        searchLabel="Search"
      />

      <CuisineList />
    </div>
  );
}

export default CuisinesList;
