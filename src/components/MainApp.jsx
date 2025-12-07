import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import HabitModal from './HabitModal';
import GoalModal from './GoalModal';
import GoalCard from './GoalCard';
import GoalDetailsModal from './GoalDetailsModal';

// UI stuff, not interesting for logic 
import { 
  Container, Typography, Card, CardContent, Button, Grid, Box, 
  Chip, Fab, IconButton, Dialog, DialogTitle, DialogContent, List,
  ListItem, ListItemIcon, ListItemText, Snackbar, Alert, TextField,
  AppBar, Toolbar
} from '@mui/material';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import FlagIcon           from '@mui/icons-material/Flag';
import AddIcon            from '@mui/icons-material/Add';
import EditIcon           from '@mui/icons-material/Edit';
import DeleteIcon         from '@mui/icons-material/Delete';
import CancelIcon         from '@mui/icons-material/Cancel';
import CheckIcon          from '@mui/icons-material/Check';
import TodayIcon          from '@mui/icons-material/Today';
import EventRepeatIcon    from '@mui/icons-material/EventRepeat';
import CalendarMonthIcon  from '@mui/icons-material/CalendarMonth';
import LogoutIcon         from '@mui/icons-material/Logout';
import AccountCircleIcon  from '@mui/icons-material/AccountCircle';
// END UI stuff

function MainApp({ user, onLogout, apiUrl  }) {
  const [habits, setHabits]         = useState([]);
  const [goals, setGoals]           = useState([]);
  const [checkins, setCheckins]     = useState([]);
  const [dayDetails, setDayDetails] = useState([]);
  
  const [isModalOpen, setIsModalOpen]             = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen]     = useState(false);
  const [isGoalDetailsOpen, setIsGoalDetailsOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen]           = useState(false);

  const [selectedGoal, setSelectedGoal]             = useState(null);
  const [selectedDate, setSelectedDate]             = useState(null);
  const [editingHabit, setEditingHabit]             = useState(null);
  const [editingGoal, setEditingGoal]               = useState(null);
  const [highlightedHabitId, setHighlightedHabitId] = useState(null);

  const [reminderSnackbar, setReminderSnackbar] = useState({
    open: false,
    habitName: '',
  });

  const reminderTimeoutsRef = useRef({});

  const USER_ID = user.id;

  const loadData = useCallback(async () => {
  try {
    const [habitsRes, checkinsRes, goalsRes] = await Promise.all([
      axios.get(`${apiUrl}/habits`),
      axios.get(`${apiUrl}/checkins`),
      axios.get(`${apiUrl}/goals`),
    ]);

    setHabits(habitsRes.data);
    setCheckins(checkinsRes.data);
    setGoals(goalsRes.data);
  } catch (err) {
    console.error('Fetching error:', err);
  }
}, [apiUrl]);

  const checkinsByDate = React.useMemo(() => {
    const map = {};
    for (const c of checkins) {
      if (!map[c.checkin_date]) {
        map[c.checkin_date] = new Set();
      }
      map[c.checkin_date].add(c.habit_id);
    }
    return map;
  }, [checkins]);

  useEffect(() => {
    loadData();
  }, [loadData]); // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    Object.values(reminderTimeoutsRef.current).forEach((id) => clearTimeout(id));
    reminderTimeoutsRef.current = {};

    const newTimeouts = {};

    habits.forEach((habit) => {
      if (!habit.reminder_time) return;

      const delay = getDelayUntilReminder(habit.reminder_time);
      if (delay == null) return;

      const timeoutId = setTimeout(() => {
        setReminderSnackbar({
          open: true,
          habitName: habit.name,
        });
        setHighlightedHabitId(habit.id);

        setTimeout(() => {
          setHighlightedHabitId((prev) => (prev === habit.id ? null : prev));
        }, 10_000);
      }, delay);

      newTimeouts[habit.id] = timeoutId;
    });

    reminderTimeoutsRef.current = newTimeouts;

    return () => {
      Object.values(newTimeouts).forEach((id) => clearTimeout(id));
    };
  }, [habits]);


  // --- CRUD functions ---

  const handleCheckIn = async (habit) => {
    if (!isHabitForToday(habit)) return;

    setHighlightedHabitId((prev) => (prev === habit.id ? null : prev));

    const today = formatLocalDate(new Date());

    try {
      await axios.post(
        `${apiUrl}/checkins`,
        { habit_id: habit.id, date: today },
        { headers: { 'user-id': USER_ID } }
      );

      const res = await axios.get(`${apiUrl}/checkins`, {
        headers: { 'user-id': USER_ID },
      });
      setCheckins(res.data);
    } catch (err) {
      console.error(err);
    }
  };


  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Delete this habit?")) return;
    try {
      await axios.delete(`${apiUrl}/habits/${habitId}`, { headers: { 'user-id': USER_ID } });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleOpenCreateHabit = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  // --- Goal handlers ---

  const handleOpenCreateGoal = () => {
      setEditingGoal(null);
      setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal) => {
      setIsGoalDetailsOpen(false);
      setEditingGoal(goal);
      setIsGoalModalOpen(true);
  };

  const handleDeleteGoal = async (goalId) => {
      if (!window.confirm("Delete this goal? All steps will be deleted too.")) return;
      try {
          await axios.delete(`${apiUrl}/goals/${goalId}`, { headers: { 'user-id': USER_ID } });
          setIsGoalDetailsOpen(false);
          loadData();
      } catch (err) { console.error(err); }
  };

  const handleOpenGoalDetails = (goal) => {
      setSelectedGoal(goal);
      setIsGoalDetailsOpen(true);
  };

  // --- Date & time logic ---

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatLocalDate(new Date());

  const todayCheckinsSet = React.useMemo(() => {
    const set = new Set();
    for (const c of checkins) {
      if (c.checkin_date === todayStr) {
        set.add(c.habit_id);
      }
    }
    return set;
  }, [checkins, todayStr]);

  const isCompletedToday = (habitId) => {
    return todayCheckinsSet.has(habitId);
  };

  const getDelayUntilReminder = (timeStr) => {
    if (!timeStr) return null;

    const [hh, mm] = timeStr.split(':'); // "HH:MM:SS" -> ["HH","MM","SS"]
    const hours = parseInt(hh, 10);
    const minutes = parseInt(mm, 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    const diff = target.getTime() - now.getTime();
    if (diff <= 0) {
      return null;
    }
    return diff;
  };

  const getTodayDbDay = () => {
    const jsDay = new Date().getDay(); // 0 = Sunday
    return jsDay === 0 ? 7 : jsDay;    // 1..7 (1 = Monday)
  };

  const isHabitForToday = (habit) => {
    const todayDbDay = getTodayDbDay();

    if (!habit.frequency || habit.frequency.type === 'daily') {
      return true;
    }

    if (habit.frequency.type === 'specific_days' && Array.isArray(habit.frequency.days)) {
      return habit.frequency.days.includes(todayDbDay);
    }

    return false;
  };

  // --- Day color logic ---
  const getDayStatusClass = ({ date, view }) => {
    if (view !== 'month') return;

    const dateStr = formatLocalDate(date);
    const jsDay = date.getDay();
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

    const doneSet = checkinsByDate[dateStr];
    if (!doneSet) return; // we have no checkins at all at this time

    const completedCount = expectedHabits.reduce(
      (count, habit) => (doneSet.has(habit.id) ? count + 1 : count),
      0
    );

    if (completedCount === 0) return;
    if (completedCount === expectedHabits.length) return 'highlight-completed';
    return 'highlight-partial';
  };


  const handleDayClick = (date) => {
    const dateStr = formatLocalDate(date);
    let jsDay = date.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay;

    const details = habits.map(habit => {
        const habitCreatedAt = formatLocalDate(new Date(habit.created_at));
        if (dateStr < habitCreatedAt) return null;

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

  const todayHabits = habits.filter(isHabitForToday);
  const otherHabits = habits.filter(habit => !isHabitForToday(habit));

  return (
    <>
    <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          mb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Habit & Goals Tracker
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AccountCircleIcon fontSize="small" />
              <Typography variant="body2">
                {user.username || user.email}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={onLogout}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4} alignItems="flex-start" sx={{ mb: 4 }}>

        {/* calendar - streaks */}

        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 4,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)'
            }}
          >
            <Box
              sx={{
                px: 2.5,
                pt: 2,
                pb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CalendarMonthIcon fontSize="small" color="primary" />
              <Typography variant="h6">Progress history</Typography>
            </Box>
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Calendar
                  tileClassName={getDayStatusClass}
                  onClickDay={handleDayClick}
                  maxDate={new Date()}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* goals */}

        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 4,
              p: 2.5,
              background: 'linear-gradient(135deg, #e8f5e9, #fffde7)',
              height: '330px',
              display: 'flex',
              flexDirection: 'column',
              
              
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlagIcon color="error" />
                <Typography variant="h5">Long-term Goals</Typography>
              </Box>
              <IconButton color="primary" onClick={handleOpenCreateGoal}>
                <AddIcon />
              </IconButton>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', overflowY: 'scroll' }}>
              {goals.map((goal) => (
                <Box key={goal.id}>
                <GoalCard
                  goal={goal}
                  onClick={() => handleOpenGoalDetails(goal)}
                />
              </Box>
              ))}
              {goals.length === 0 && (
                <Typography color="text.secondary">
                  No goals set. Click + to add one.
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* habits - today */}

      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}
        >
          <TodayIcon color="success" />
          <Typography variant="h5">Habits for today</Typography>
          {todayHabits.length > 0 && (
            <Chip
              label={`${todayHabits.length}`}
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {todayHabits.length === 0 ? (
          <Card sx={{ p: 2, borderRadius: 2, borderStyle: 'dashed', borderColor: 'divider' }}>
            <Typography color="text.secondary">
              No habits scheduled for today.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {todayHabits.map((habit) => (
              <Grid key={habit.id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 3.5 }}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    p: 1.8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #e3f2fd, #e8f5e9)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 6
                    },
                    boxShadow: highlightedHabitId === habit.id ? 8 : 3,
                    transform: highlightedHabitId === habit.id ? 'translateY(-2px)' : 'none',
                    border: highlightedHabitId === habit.id ? '2px solid #ff9800' : '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease-out'
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
                    {habit.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1, wordBreak: 'break-word', maxHeight: '42px', overflowY: 'auto' }}
                      >
                        {habit.description}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: -4 }}
                    >
                      Frequency:{' '}
                      {habit.frequency?.type === 'specific_days'
                        ? `Days: ${habit.frequency.days.join(', ')}`
                        : 'Daily'}
                      {habit.reminder_time
                        ? ` • ⏰ ${habit.reminder_time.slice(0, 5)}`
                        : ''}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2
                    }}
                  >
                    <Button
                      variant={isCompletedToday(habit.id) ? 'contained' : 'outlined'}
                      color={isCompletedToday(habit.id) ? 'success' : 'primary'}
                      startIcon={<CheckCircleIcon />}
                      size="small"
                      onClick={() => handleCheckIn(habit)}
                      disabled={isCompletedToday(habit.id)}
                      sx={{ borderRadius: 999, px: 2 }}
                    >
                      {isCompletedToday(habit.id) ? 'Done' : 'Check in'}
                    </Button>
                    <Box>
                      <IconButton size="small" onClick={() => handleEditHabit(habit)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteHabit(habit.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* habits - other days */}

      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}
        >
          <EventRepeatIcon color="action" />
          <Typography variant="h5">Habits for other days</Typography>
          {otherHabits.length > 0 && (
            <Chip
              label={`${otherHabits.length}`}
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {otherHabits.length === 0 ? (
          <Card sx={{ p: 2, borderRadius: 2, borderStyle: 'dashed', borderColor: 'divider' }}>
            <Typography color="text.secondary">
              No habits on other days.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {otherHabits.map((habit) => (
              <Grid key={habit.id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ mb: 3.5 }}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 1.8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8f8f8',
                    opacity: 0.9
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
                    {habit.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5, wordBreak: 'break-word' }}
                      >
                        {habit.description}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: -4 }}
                    >
                      Frequency:{' '}
                      {habit.frequency?.type === 'specific_days'
                        ? `Days: ${habit.frequency.days.join(', ')}`
                        : 'Daily'}
                      {habit.reminder_time
                        ? ` • ⏰ ${habit.reminder_time.slice(0, 5)}`
                        : ''}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      disabled
                      startIcon={<CheckCircleIcon />}
                      sx={{ borderRadius: 999, px: 2, opacity: 0.7 }}
                    >
                      Not today
                    </Button>
                    <Box>
                      <IconButton size="small" onClick={() => handleEditHabit(habit)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteHabit(habit.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 30, right: 30 }} onClick={handleOpenCreateHabit}>
        <AddIcon />
      </Fab>

      <HabitModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadData}
        userId={USER_ID}
        habitToEdit={editingHabit} 
      />
      
      <GoalModal
        open={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        onSuccess={loadData}
        userId={USER_ID}
        goalToEdit={editingGoal}
        apiUrl={apiUrl}
      />

      <GoalDetailsModal
        open={isGoalDetailsOpen}
        onClose={() => setIsGoalDetailsOpen(false)}
        goal={selectedGoal}
        userId={USER_ID}
        onEditGoal={handleEditGoal}
        onDeleteGoal={handleDeleteGoal}
        onGoalUpdated={loadData}
        apiUrl={apiUrl}
      />

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

      <Snackbar
        open={reminderSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setReminderSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setReminderSnackbar((prev) => ({ ...prev, open: false }))}
          severity="info"
          sx={{ width: '100%' }}
        >
          Time for habit: <strong>{reminderSnackbar.habitName}</strong>
        </Alert>
      </Snackbar>

    </Container>
    </>
  );
}

export default MainApp;