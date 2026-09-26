import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { UnfoldMore, Storefront } from "@mui/icons-material";


export default function RestaurantTable({ columns, rows = [], loading = false, children }) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        border: '1px solid rgba(224,224,224,1)',
      }}
      className=" p-4 "
    >
      {children ? <Box mb={2}>{children}</Box> : null}
      <Box sx={{ overflow: 'auto' }}>
        <Table sx={{ borderCollapse: 'collapse', '& .MuiTableCell-root': { border: '1px solid rgba(224,224,224,1)' } }} className="p-2">
        <TableHead>
          <TableRow>
            {columns.map((col, colIndex) => (
              <TableCell key={col.key}>
                {colIndex === 0 ? null : (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography fontWeight={600}>
                      {col.label}
                    </Typography>
                    <UnfoldMore fontSize="small" sx={{ color: "grey.400" }} />
                  </Stack>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <CircularProgress size={32} sx={{ color: "#00a67e" }} />
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                  Loading restaurants from database...
                </Typography>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Storefront sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                  No Restaurants Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No restaurant records match the current filters in database.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={row._id || row.id || rowIndex} hover>
                {columns.map((col, colIndex) => (
                  <TableCell key={col.key}>
                    {colIndex === 0
                      ? rowIndex + 1
                      : col.render
                      ? col.render(row, rowIndex)
                      : row[col?.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        </Table>
      </Box>
    </TableContainer>
  );
}
