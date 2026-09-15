import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageHeader from "../../components/PageHeader";
const countries = [
  { country: "Malaysia", code: "+60", currency: "MYR", symbol: "RM", default: true },
  { country: "Srilanka", code: "+94", currency: "Rs", symbol: "Rs" },
  { country: "Argentina", code: "+54", currency: "ARS", symbol: "$" },
  { country: "India", code: "91", currency: "INR", symbol: "₹" },
  { country: "Yerevan", code: "+374", currency: "AMD", symbol: "֏" },
  { country: "United Kingdom", code: "+44", currency: "GBP", symbol: "£" },
  { country: "Ecuador", code: "EC", currency: "USD", symbol: "$" },
  { country: "Saudi Arabia", code: "966", currency: "SAR", symbol: "SA" },
  { country: "Nigeria", code: "+234", currency: "NGN", symbol: "₦" },
  { country: "Singapore", code: "+65", currency: "SGD", symbol: "S$" }
];

export default function CountryList() {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
       <PageHeader
			title="Country List"
			breadcrumbs={[
			  { label: "Country List" },
			  { label: "Country", active: true }
			]}
		  />
      <div className="flex items-center justify-between mb-4">
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium">
          + Add Country
        </button>

        <div className="flex items-center gap-3">
          <button className="bg-yellow-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
            🎥 Video Tutorial
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Search</span>
            <input
              type="text"
              placeholder="Search"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <TableContainer component={Paper} elevation={0} className="border border-gray-200">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Country Code</TableCell>
              <TableCell>Currency Code</TableCell>
              <TableCell>Currency Symbol</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {countries.map((row, index) => (
              <TableRow key={row.country} className="hover:bg-gray-50">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.country}</TableCell>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>{row.symbol}</TableCell>

                <TableCell className="flex items-center gap-3">
                  <IconButton size="small">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>

                  {row.default ? (
                    <span className="border border-emerald-400 text-emerald-500 px-3 py-1 rounded-md text-sm">
                      Default
                    </span>
                  ) : (
                    <button className="border border-orange-400 text-orange-500 px-3 py-1 rounded-md text-sm hover:bg-orange-50">
                      Make Default
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
