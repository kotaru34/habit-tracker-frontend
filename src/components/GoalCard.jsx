import React from 'react';
import { Card, CardContent, CardActionArea, Typography, Box, LinearProgress, Chip } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

const GoalCard = React.memo(({ goal, onClick }) => {
  const total = goal.total_steps || 0;
  const completed = goal.completed_steps || 0;
  
  let progress = 0;
  if (total > 0) {
    progress = (completed / total) * 100;
  } else if (goal.status === 'completed') {
    progress = 100;
  }

  let statusColor = 'primary';
  let statusLabel = 'In Progress';
  
  if (goal.status === 'completed') {
    statusColor = 'success';
    statusLabel = 'Completed';
  } else if (goal.status === 'overdue') {
    statusColor = 'error';
    statusLabel = 'Overdue';
  }

  return (
    <Card sx={{ mb: 2, borderLeft: goal.status === 'overdue' ? '4px solid #d32f2f' : 'none' }}>
      <CardActionArea onClick={() => onClick(goal)}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
            <Typography variant="h6" component="div">{goal.name}</Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={statusLabel} color={statusColor} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
              {total > 0 && (
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {Math.round(progress)}%
                </Typography>
              )}
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={statusColor}
            sx={{ height: 6, borderRadius: 3, mb: 1.5, bgcolor: '#f0f0f0' }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon fontSize="small" color={goal.status === 'overdue' ? 'error' : 'action'} />
              <Typography variant="caption" color={goal.status === 'overdue' ? 'error' : 'textSecondary'}>
                {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No Deadline'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {total > 0 ? `${completed}/${total} steps` : 'No steps'}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
});

export default GoalCard;