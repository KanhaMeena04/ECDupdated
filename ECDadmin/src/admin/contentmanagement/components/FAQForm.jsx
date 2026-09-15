import React, { useState } from 'react';
import { Button, TextField, Paper } from '@mui/material';
import TextEditor from './TextEditor';

function FAQForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Question is required');
      return;
    }

    onSave({
      title,
      answer,
      category,
    });
  };

  return (
    <Paper className="p-6">
      <TextField
        fullWidth
        label="Question"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        margin="normal"
      />

      <TextEditor
        title="Answer"
        initialValue={answer}
        onChange={setAnswer} 
        showSaveButton={false}
      />

      <div className="flex gap-3 mt-4">
        <Button
          variant="contained"
          sx={{ backgroundColor: '#10b981' }}
          onClick={handleSubmit}
        >
          Save FAQ
        </Button>

        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Paper>
  );
}

export default FAQForm;

