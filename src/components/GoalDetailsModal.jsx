import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box, List, ListItem, ListItemText, 
  ListItemIcon, Checkbox, IconButton, Typography, LinearProgress, Divider 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

const API_URL = 'http://localhost:5000/api';

const GoalDetailsModal = ({ open, onClose, goal, userId, onDeleteGoal, onEditGoal, onGoalUpdated }) => {
  const [steps, setSteps] = useState([]);
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    if (open && goal) {
      fetchSteps();
      setNewStep('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal, userId]);

  const fetchSteps = async () => {
    try {
      const res = await axios.get(`${API_URL}/goals/${goal.id}/steps`, { headers: { 'user-id': userId } });
      setSteps(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddStep = async () => {
    if (!newStep.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/goals/${goal.id}/steps`, 
        { description: newStep }, 
        { headers: { 'user-id': userId } }
      );
      setSteps((prev) => [...prev, res.data]);
      setNewStep('');
      if (onGoalUpdated) onGoalUpdated();
    } catch (err) { console.error(err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStep();
    }
  };

  const handleToggleStep = async (step) => {
    try {
      const updatedSteps = steps.map(s =>
        s.id === step.id ? { ...s, is_completed: !s.is_completed } : s
      );
      setSteps(updatedSteps);
      await axios.put(
        `${API_URL}/goal-steps/${step.id}`,
        { is_completed: !step.is_completed },
        { headers: { 'user-id': userId } }
      );
      if (onGoalUpdated) onGoalUpdated();
    } catch (err) { console.error(err); fetchSteps(); }
  };

  const handleDeleteStep = async (stepId) => {
    try {
      await axios.delete(`${API_URL}/goal-steps/${stepId}`, { headers: { 'user-id': userId } });
      fetchSteps();
      if (onGoalUpdated) onGoalUpdated();
    } catch (err) { console.error(err); }
  };


  const completedCount = steps.filter(s => s.is_completed).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  if (!goal) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <Box>
          {goal.name}
          <Typography variant="body2" color="text.secondary">{goal.description}</Typography>
        </Box>
        <Box>
          {onEditGoal && (
            <IconButton size="small" onClick={() => onEditGoal(goal)}>
              <EditIcon />
            </IconButton>
          )}
          <IconButton size="small" color="error" onClick={() => onDeleteGoal(goal.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </DialogTitle>
        
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">Progress</Typography>
            <Typography variant="caption">{Math.round(progress)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} color={progress === 100 ? "success" : "primary"} />
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Steps:</Typography>
        
        <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
          {steps.map((step) => (
            <ListItem key={step.id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" size="small" color="error" onClick={() => handleDeleteStep(step.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
            <ListItemIcon>
              <Checkbox 
                edge="start"
                checked={step.is_completed}
                onChange={() => handleToggleStep(step)}
                color="success"
              />
              </ListItemIcon>
              <ListItemText 
                primary={step.description} 
                sx={{ textDecoration: step.is_completed ? 'line-through' : 'none', color: step.is_completed ? 'text.secondary' : 'text.primary', pr: 2 }}
              />
            </ListItem>
          ))}
          {steps.length === 0 && <Typography variant="body2" align="center" sx={{ p: 2, color: 'text.secondary' }}>No steps yet.</Typography>}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField 
            fullWidth 
            size="small" 
            placeholder="Add a new step..."
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button variant="contained" onClick={handleAddStep} startIcon={<AddIcon />}>
            Add
          </Button>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalDetailsModal;