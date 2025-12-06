import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { // UI stuff, not interesting for logic
  Container, Typography, Card, CardContent, Button, Grid, Box, 
  Chip, Divider, LinearProgress 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import FlagIcon from '@mui/icons-material/Flag';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [checkins, setCheckins] = useState([]);
  
  const USER_ID = 1; 

  useEffect(() => {
    const loadData = async () => {
      try {
        const habitsRes = await axios.get(`${API_URL}/habits`, { headers: { 'user-id': USER_ID } });
        setHabits(habitsRes.data);

        const checkinsRes = await axios.get(`${API_URL}/checkins`, { headers: { 'user-id': USER_ID } });
        setCheckins(checkinsRes.data);

        const goalsRes = await axios.get(`${API_URL}/goals`, { headers: { 'user-id': USER_ID } });
        setGoals(goalsRes.data);

      } catch (err) {
        console.error("Fetching error:", err);
      }
    };

    loadData();
  }, []); 

  const handleCheckIn = async (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await axios.post(`${API_URL}/checkins`, { habit_id: habitId, date: today });
      
      const res = await axios.get(`${API_URL}/checkins`, { headers: { 'user-id': USER_ID } });
      setCheckins(res.data);
      
    } catch (err) {
      console.error(err);
      alert('Error recording check-in.');
    }
  };

  // --- HELPER FUNCTIONS ---
  const isCompletedToday = (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    return checkins.some(c => c.habit_id === habitId && c.checkin_date === today);
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatLocalDate(date);
      
      if (checkins.some(c => c.checkin_date === dateStr)) {
        return 'highlight';
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
        Habit & Goal Tracker
      </Typography>

      <Grid container spacing={4}>
        
        { /* left column - habits */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
             <Typography variant="h5" sx={{ flexGrow: 1 }}>My Habits</Typography>
          </Box>
          
          {habits.map((habit) => (
            <Card 
                key={habit.id} 
                sx={{ 
                    mb: 2, 
                    borderLeft: `6px solid ${habit.category_color || '#ccc'}`,
                    transition: '0.3s',
                    '&:hover': { boxShadow: 6 }
                }}
            >
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" component="div">
                        {habit.name}
                      </Typography>
                      {habit.category_name && (
                        <Chip 
                            label={habit.category_name} 
                            size="small" 
                            sx={{ 
                                backgroundColor: habit.category_color, 
                                color: '#fff', 
                                height: 20, 
                                fontSize: '0.7rem' 
                            }} 
                        />
                      )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {habit.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                     Frequency: {habit.frequency?.type || 'Daily'} 
                     {habit.reminder_time ? ` • Reminder: ${habit.reminder_time}` : ''}
                  </Typography>
                </Box>
                
                <Button 
                  variant={isCompletedToday(habit.id) ? "contained" : "outlined"}
                  color={isCompletedToday(habit.id) ? "success" : "primary"}
                  onClick={() => handleCheckIn(habit.id)}
                  startIcon={<CheckCircleIcon />}
                  disabled={isCompletedToday(habit.id)}
                  sx={{ minWidth: '130px' }}
                >
                  {isCompletedToday(habit.id) ? "Done!" : "Check In"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {habits.length === 0 && <Typography color="text.secondary">No habits found.</Typography>}
        </Grid>

        {/* right column - calendar and goals */}
        <Grid item xs={12} md={5}>
          
          {/* Календар */}
          <Typography variant="h5" gutterBottom>Progress History</Typography>
          <Card sx={{ mb: 4, p: 2 }}>
             <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Calendar tileClassName={tileClassName} />
             </Box>
          </Card>

          {/* goals */}
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon color="error" /> Long-term Goals
          </Typography>
          
          {goals.map((goal) => (
             <Card key={goal.id} sx={{ mb: 2 }}>
                 <CardContent>
                     <Typography variant="h6">{goal.name}</Typography>
                     <Typography variant="body2" color="text.secondary" gutterBottom>
                         {goal.description}
                     </Typography>
                     
                     <Divider sx={{ my: 1 }} />
                     
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                         <EventIcon fontSize="small" color="action" />
                         <Typography variant="caption">
                             Deadline: {formatDate(goal.deadline)}
                         </Typography>
                     </Box>

                     {/* Progress immitation (TODO:) */}
                     <Box sx={{ mt: 2 }}>
                         <Typography variant="caption" display="block" align="right">
                             Status: {goal.status.replace('_', ' ')}
                         </Typography>
                         <LinearProgress 
                            variant="determinate" 
                            value={goal.status === 'completed' ? 100 : 30} 
                            color={goal.status === 'completed' ? "success" : "primary"}
                            sx={{ height: 8, borderRadius: 5 }}
                         />
                     </Box>
                 </CardContent>
             </Card>
          ))}
          {goals.length === 0 && <Typography color="text.secondary">No goals set yet.</Typography>}

        </Grid>
      </Grid>
    </Container>
  );
}

export default App;