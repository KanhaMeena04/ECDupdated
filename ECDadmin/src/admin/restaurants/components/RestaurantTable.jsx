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
} from "@mui/material";
import { UnfoldMore } from "@mui/icons-material";


export default function RestaurantTable({ columns, rows, children }) {
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
          {rows.map((row, rowIndex) => (
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
          ))}
        </TableBody>
        </Table>
      </Box>
    </TableContainer>
  );
}
