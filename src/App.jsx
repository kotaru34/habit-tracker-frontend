import { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import HabitModal from './components/HabitModal';

// UI stuff, not interesting for logic
import { 
  Container, Typography, Card, CardContent, Button, Grid, Box, 
  Chip, Divider, LinearProgress, Fab, IconButton,
  Dialog, DialogTitle, DialogContent, List, ListItem, ListItemIcon, ListItemText 
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Event as EventIcon, 
  Flag as FlagIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Check as CheckIcon
} from '@mui/icons-material';
// END UI stuff

const API_URL = 'http://localhost:5000/api';

function App() {
  const [habits, setHabits]             = useState([]);
  const [goals, setGoals]               = useState([]);
  const [checkins, setCheckins]         = useState([]);
  
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetails, setDayDetails]     = useState([]);

  const USER_ID = 1; 


  const loadData = async () => {
    try {
      const [habitsRes, checkinsRes, goalsRes] = await Promise.all([
        axios.get(`${API_URL}/habits`,   { headers: { 'user-id': USER_ID } }),
        axios.get(`${API_URL}/checkins`, { headers: { 'user-id': USER_ID } }),
        axios.get(`${API_URL}/goals`,    { headers: { 'user-id': USER_ID } })
      ]);
      setHabits(habitsRes.data);
      setCheckins(checkinsRes.data);
      setGoals(goalsRes.data);
    } catch (err) {
      console.error("Fetching error:", err);
    }
  };

  useEffect(() => {
    loadData(); // <- Ignore
  }, []);

  // --- CRUD functions ---
  const handleCheckIn = async (habitId) => {
    const today = formatLocalDate(new Date());
    try {
      await axios.post(`${API_URL}/checkins`, { habit_id: habitId, date: today });
      const res = await axios.get(`${API_URL}/checkins`, { headers: { 'user-id': USER_ID } });
      setCheckins(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm("Delete this habit?")) return;
    try {
      await axios.delete(`${API_URL}/habits/${habitId}`, { headers: { 'user-id': USER_ID } });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  // --- Date & time logic ---

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isCompletedToday = (habitId) => {
    const today = formatLocalDate(new Date());
    return checkins.some(c => c.habit_id === habitId && c.checkin_date === today);
  };

  // --- Day color logic ---
  const getDayStatusClass = ({ date, view }) => {
    if (view !== 'month') return;

    const dateStr = formatLocalDate(date);
    
    // JS getDay(): 0=Sun, 1=Mon ... 6=Sat -> DB: 1=Mon ... 7=Sun
    let jsDay = date.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay; 

    const expectedHabits = habits.filter(h => {
        if (h.is_archived) return false;

        const habitCreatedAt = formatLocalDate(new Date(h.created_at));

        if (dateStr < habitCreatedAt) return false;
        if (!h.frequency || h.frequency.type === 'daily') return true;
        if (h.frequency.type === 'specific_days' && Array.isArray(h.frequency.days)) {
            return h.frequency.days.includes(dbDay);
        }
        return false;
    });

    if (expectedHabits.length === 0) return; 

    const completedCount = expectedHabits.reduce((count, habit) => {
        const isDone = checkins.some(c => c.habit_id === habit.id && c.checkin_date === dateStr);
        return isDone ? count + 1 : count;
    }, 0);

    if (completedCount === 0) return; 
    if (completedCount === expectedHabits.length) return 'highlight-completed';
    return 'highlight-partial';
  };

  // --- Day click. That's it ---
  const handleDayClick = (date) => {
    const dateStr = formatLocalDate(date);
    let jsDay = date.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay;

    const details = habits.map(habit => {
        const habitCreatedAt = formatLocalDate(new Date(habit.created_at));
        if (dateStr < habitCreatedAt) {
            return null;
        }

        let isExpected = true;
        if (habit.frequency?.type === 'specific_days') {
            isExpected = habit.frequency.days.includes(dbDay);
        }

        const isDone = checkins.some(c => c.habit_id === habit.id && c.checkin_date === dateStr);

        return { 
            name: habit.name, 
            category_color: habit.category_color,
            isExpected, 
            isDone 
        };
    })
    .filter(item => item !== null && item.isExpected);

    setSelectedDate(dateStr);
    setDayDetails(details);
    setDayModalOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
        Habit & Goal Tracker
      </Typography>

      <Grid container spacing={4}>

        {/* left column - habits */}

        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
             <Typography variant="h5" sx={{ flexGrow: 1 }}>My Habits</Typography>
          </Box>
          {habits.map((habit) => (
            <Card key={habit.id} sx={{ mb: 2, borderLeft: `6px solid ${habit.category_color || '#ccc'}`, transition: '0.3s', '&:hover': { boxShadow: 6 } }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6">{habit.name}</Typography>
                      {habit.category_name && ( <Chip label={habit.category_name} size="small" sx={{ backgroundColor: habit.category_color, color: '#fff', height: 20, fontSize: '0.7rem' }} /> )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{habit.description}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                     Frequency: {habit.frequency?.type === 'specific_days' ? `Days: ${habit.frequency.days.join(', ')}` : 'Daily'}
                     {habit.reminder_time ? ` • ⏰ ${habit.reminder_time.slice(0, 5)}` : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Button 
                        variant={isCompletedToday(habit.id) ? "contained" : "outlined"}
                        color={isCompletedToday(habit.id) ? "success" : "primary"}
                        onClick={() => handleCheckIn(habit.id)}
                        startIcon={<CheckCircleIcon />}
                        disabled={isCompletedToday(habit.id)}
                        size="small" sx={{ minWidth: '110px' }}
                    >
                        {isCompletedToday(habit.id) ? "Done" : "Check In"}
                    </Button>
                    <Box>
                        <IconButton size="small" onClick={() => handleEdit(habit)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(habit.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
          {habits.length === 0 && <Typography color="text.secondary">No habits found.</Typography>}
        </Grid>

        {/* right column - calendat + goals */}

        <Grid item xs={12} md={5}>
          <Typography variant="h5" gutterBottom>Progress History</Typography>
          <Card sx={{ mb: 4, p: 2 }}>
             <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Calendar 
                tileClassName={getDayStatusClass}
                onClickDay={handleDayClick}
                maxDate={new Date()}              // Block future xD
              />
             </Box>
          </Card>

          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon color="error" /> Long-term Goals
          </Typography>
          {goals.map((goal) => (
             <Card key={goal.id} sx={{ mb: 2 }}>
                 <CardContent>
                     <Typography variant="h6">{goal.name}</Typography>
                     <Divider sx={{ my: 1 }} />
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                         <EventIcon fontSize="small" color="action" />
                         <Typography variant="caption">Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'None'}</Typography>
                     </Box>
                     <Box sx={{ mt: 2 }}>
                         <LinearProgress variant="determinate" value={goal.status === 'completed' ? 100 : 30} color={goal.status === 'completed' ? "success" : "primary"} sx={{ height: 8, borderRadius: 5 }} />
                     </Box>
                 </CardContent>
             </Card>
          ))}
        </Grid>
      </Grid>

      {/* fab create button */}

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 30, right: 30 }} onClick={handleOpenCreate}>
        <AddIcon />
      </Fab>

      {/* modal: create/edit habit */}

      <HabitModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadData}
        userId={USER_ID}
        habitToEdit={editingHabit} 
      />

      {/* modal: day details */}

      <Dialog open={dayModalOpen} onClose={() => setDayModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>
            History: {selectedDate}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
            <List>
                {dayDetails.map((item, index) => (
                    <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon>
                            {item.isDone 
                                ? <CheckIcon color="success" /> 
                                : <CancelIcon color="error" />
                            }
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.name} 
                            secondary={item.isDone ? "Completed" : "Missed"}
                        />
                    </ListItem>
                ))}
            </List>
            {dayDetails.length === 0 && <Typography align="center">No habits were scheduled for this day.</Typography>}
        </DialogContent>
      </Dialog>

    </Container>
  );
}

export default App;