import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box
} from '@mui/material';

const API_URL = 'http://localhost:5000/api';

const GoalModal = ({ open, onClose, onSuccess, userId, goalToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (goalToEdit) {
        setName(goalToEdit.name || '');
        setDescription(goalToEdit.description || '');
        
        let dateVal = '';
        if (goalToEdit.deadline) {
          try {
            dateVal = new Date(goalToEdit.deadline).toISOString().split('T')[0];
          } catch (e) {
            console.error("Invalid date format", e);
          }
        }
        setDeadline(dateVal);        
      } else {
        setName('');
        setDescription('');
        setDeadline('');
      }
    }
  }, [open, goalToEdit]);

  const handleSubmit = async () => {
    if (!name.trim()) return alert("Please enter a goal name");

    setLoading(true);

    const payload = {
      name,
      description,
      deadline: deadline || null,
    };

    try {
      if (goalToEdit) {
        await axios.put(`${API_URL}/goals/${goalToEdit.id}`, payload, { headers: { 'user-id': userId } });
      } else {
        await axios.post(`${API_URL}/goals`, payload, { headers: { 'user-id': userId } });
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{goalToEdit ? 'Edit Goal' : 'Set New Long-term Goal'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Goal Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Target Deadline"
            type="date"
            fullWidth
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? 'Saving...' : (goalToEdit ? 'Save Changes' : 'Create Goal')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalModal;