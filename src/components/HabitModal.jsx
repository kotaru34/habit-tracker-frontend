import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, MenuItem, FormControl, InputLabel, Select, 
  Box, FormGroup, FormControlLabel, Checkbox, FormLabel, Grid 
} from '@mui/material';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' }
];

const HabitModal = ({ open, onClose, onSuccess, userId, habitToEdit, apiUrl }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  
  // Complex frequency
  const [freqType, setFreqType] = useState('daily'); // 'daily' || 'specific_days'
  const [selectedDays, setSelectedDays] = useState([]); // Num array [1, 3, 5]

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const initData = async () => {
      if (open) {
        try {
          const res = await axios.get(`${apiUrl}/categories`, { headers: { 'user-id': userId } });
          setCategories(res.data);
          
          if (habitToEdit) {
            setName(habitToEdit.name);
            setDescription(habitToEdit.description || '');
            setCategoryId(habitToEdit.category_id || (res.data[0]?.id || ''));
            setReminderTime(habitToEdit.reminder_time || ''); // Set as "09:00:00"
            
            // Parse frequency
            const freq = habitToEdit.frequency || { type: 'daily' };
            setFreqType(freq.type);
            if (freq.type === 'specific_days') {
              setSelectedDays(freq.days || []);
            } else {
              setSelectedDays([]);
            }
          } else {
            // Logic for creation (fields reset)
            setName('');
            setDescription('');
            setReminderTime('');
            setFreqType('daily');
            setSelectedDays([]);
            if (res.data.length > 0) setCategoryId(res.data[0].id);
          }
        } catch (err) {
          console.error("Error loading modal data", err);
        }
      }
    };

    initData();
  }, [open, habitToEdit, userId, apiUrl]); // Dependencies: reload when opened or edited habit

  // Checkbox proccessor
  const handleDayToggle = (dayId) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = async () => {
    if (!name) return alert("Please enter a name");

    const frequency = {
      type: freqType,
      days: freqType === 'specific_days' ? selectedDays : []
    };

    const payload = {
      name,
      description,
      category_id: categoryId,
      reminder_time: reminderTime,
      frequency
    };

    try {
      if (habitToEdit) {
        // UPDATE
        await axios.put(`${apiUrl}/habits/${habitToEdit.id}`, payload, { headers: { 'user-id': userId } });
      } else {
        // CREATE
        await axios.post(`${apiUrl}/habits`, payload, { headers: { 'user-id': userId } });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving habit");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{habitToEdit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Habit Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((cat) => ( <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>))}
            </Select>
          </FormControl>

          {/* time */}
          
          <TextField
            label="Reminder Time"
            type="time"
            fullWidth
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />

          {/* frequency */}
          
          <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2 }}>
            <FormLabel component="legend">Frequency</FormLabel>
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <Select
                value={freqType}
                size="small"
                onChange={(e) => setFreqType(e.target.value)}
              >
                <MenuItem value="daily">Every Day</MenuItem>
                <MenuItem value="specific_days">Specific Days</MenuItem>
              </Select>
            </FormControl>

            {freqType === 'specific_days' && (
              <FormGroup row>
                {DAYS_OF_WEEK.map(day => (
                  <FormControlLabel
                    key={day.id}
                    control={
                      <Checkbox 
                        checked={selectedDays.includes(day.id)} 
                        onChange={() => handleDayToggle(day.id)}
                        size="small"
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {habitToEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HabitModal;