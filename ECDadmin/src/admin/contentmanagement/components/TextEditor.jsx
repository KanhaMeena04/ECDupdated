import React, { useState, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill';
import "react-quill/dist/quill.snow.css";
import { Button, Paper, Typography, Box } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const TextEditor = ({
  initialValue = "",
  onSave,
  onChange,
  title = "General Site Usage",
  showSaveButton = true, // ✅ DEFAULT TRUE
}) => {
  const [content, setContent] = useState(initialValue);

  // Sync when initialValue changes (edit mode)
  useEffect(() => {
    setContent(initialValue || "");
  }, [initialValue]);

  // Prevent toolbar re-render
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  }), []);

  const handleChange = (value) => {
    setContent(value);
    onChange?.(value); // 🔥 parent gets live value
  };

  const handleSave = () => {
    onSave?.(content);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, m: 2, bgcolor: 'background.paper' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151' }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#6B7280' }}>
          Last Revised: {new Date().toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          style={{ height: '300px', marginBottom: '50px' }}
        />
      </Box>

      {showSaveButton && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 8 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              textTransform: 'none',
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
            }}
          >
            Save Content
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default TextEditor;
