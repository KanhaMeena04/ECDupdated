import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PageHeader from "../../components/PageHeader";
import PageActionBar from "../../components/PageActionBar";
import {useCities} from "../../api/city";
import { useNavigate } from "react-router-dom";

export default function CityTable() {
  const navigate = useNavigate();
  const { cities, loading, error } = useCities();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <PageHeader
        title="City List"
        breadcrumbs={[
          { label: "City List" },
          { label: "City", active: true },
        ]}
      />

      <PageActionBar
        buttonLabel="Add New City"
        onButtonClick={() => navigate("/add-city")}
      />

      <TableContainer component={Paper} elevation={0} className="border border-gray-200">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Area</TableCell>
              <TableCell>City</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.isArray(cities) &&
              cities.map((row, index) => (
                <TableRow key={row._id} className="hover:bg-gray-50">
                  <TableCell>{index + 1}</TableCell>

                  <TableCell>{row.area || "-"}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.state}</TableCell>
                  <TableCell>{row.country}</TableCell>

                  <TableCell>
                    {row.isActive ? (
                      <span className="border border-emerald-400 text-emerald-500 px-4 py-1 rounded-md text-sm">
                        Active
                      </span>
                    ) : (
                      <span className="border border-orange-400 text-orange-500 px-4 py-1 rounded-md text-sm">
                        Inactive
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="flex items-center gap-3">
                    

                    {/* ADD AREA */}
                    <button
                      className="flex items-center gap-1 border border-emerald-500 text-emerald-500 px-3 py-1 rounded-md text-sm hover:bg-emerald-50"
                      onClick={() =>
                        navigate(`/edit-city/${row._id}`, {
                          state: { mode: "add-area", city: row },
                        })
                      }
                    >
                      <AddIcon fontSize="small" />
                      Add Area
                    </button>

                    {/* VIEW */}
                    <button
                      className="flex items-center gap-1 border border-emerald-500 text-emerald-500 px-3 py-1 rounded-md text-sm hover:bg-emerald-50"
                      onClick={() =>
                        navigate(`/city/view/${row._id}`, {
                          state: { city: row },
                        })
                      }
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                      View Area
                    </button>
                  </TableCell>
                </TableRow>
              ))}

            {cities.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No cities found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
