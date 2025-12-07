import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Card,
  Button,
  Box,
  TextField,
} from '@mui/material';

function AuthScreen({ onAuth, apiUrl }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        console.log("huh", apiUrl);
        const res = await axios.post(`${apiUrl}/auth/login`, { email, password });
        onAuth(res.data); // { token, user }
      } else {
        const res = await axios.post(`${apiUrl}/auth/register`, {
          username,
          email,
          password,
        });
        onAuth(res.data); // auto-login after registration
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Auth error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 6 }}>
        <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: 600 }}>
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </Typography>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Log in'
              : 'Create account'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            size="small"
            onClick={() =>
              setMode((m) => (m === 'login' ? 'register' : 'login'))
            }
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </Button>
        </Box>
      </Card>
    </Container>
  );
}

export default AuthScreen;