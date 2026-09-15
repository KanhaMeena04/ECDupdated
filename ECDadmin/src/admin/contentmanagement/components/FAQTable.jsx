import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';

function FAQTable({ faqs, onEditClick, onDeleteClick }) {
  if (!faqs.length) {
    return <p className="text-gray-500">No FAQs found</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Question</TableCell>
          <TableCell>Category</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {faqs.map((faq) => (
          <TableRow key={faq._id}>
            <TableCell>{faq.title}</TableCell>
            <TableCell>{faq.category || 'General'}</TableCell>
            <TableCell align="right">
              <Button size="small" onClick={() => onEditClick(faq)}>
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => onDeleteClick(faq._id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default FAQTable;

