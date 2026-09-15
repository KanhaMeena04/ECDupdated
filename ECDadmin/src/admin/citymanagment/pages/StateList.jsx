import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageHeader from "../../components/PageHeader";
const stateList = [
  { id: 1, state: "savoie", country: "France" },
  { id: 2, state: "Karnataka", country: "India" },
  { id: 3, state: "Selangor", country: "Malaysia" },
  { id: 4, state: "Delhi", country: "India" },
  { id: 5, state: "California", country: "Yerevan" },
  { id: 6, state: "Essex", country: "United Kingdom" },
  { id: 7, state: "sangolqui", country: "Ecuador" },
  { id: 8, state: "West Bengal", country: "India" },
  { id: 9, state: "Asia", country: "Saudi Arabia" },
  { id: 10, state: "Mumbai", country: "India" }
];

export default function StateList() {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
       <PageHeader
			title="State List"
			breadcrumbs={[
			  { label: "State List" },
			  { label: "State", active: true }
			]}
		  />
      <div className="flex items-center justify-between mb-4">
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium">
          + Add State
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Search</span>
          <input
            placeholder="Search"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* TABLE */}
      <TableContainer component={Paper} elevation={0} className="border border-gray-200">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Country ID</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {stateList.map((row, index) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                <TableCell>{index + 1}</TableCell>

                <TableCell className="text-gray-700">
                  {row.state}
                </TableCell>

                <TableCell className="text-gray-700">
                  {row.country}
                </TableCell>

                <TableCell>
                  <IconButton size="small">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FOOTER / PAGINATION */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          Showing 1 to
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option>10</option>
          </select>
          of 202 entries
        </div>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center border rounded-full">
            ‹
          </button>

          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-white">
            1
          </button>

          {[2, 3, 4, 5].map(n => (
            <button
              key={n}
              className="w-8 h-8 flex items-center justify-center border rounded-full"
            >
              {n}
            </button>
          ))}

          <span className="px-1">…</span>

          <button className="w-8 h-8 flex items-center justify-center border rounded-full">
            21
          </button>

          <button className="w-8 h-8 flex items-center justify-center border rounded-full">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

