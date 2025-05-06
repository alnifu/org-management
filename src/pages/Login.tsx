import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Stack,
  Center,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface LoginFormValues {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? 'Username is required' : null),
      password: (value) => (!value ? 'Password is required' : null),
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      const { user, error } = await login(values.username, values.password);
      
      if (error) {
        notifications.show({
          title: 'Error',
          message: error,
          color: 'red',
        });
        return;
      }

      if (!user) {
        notifications.show({
          title: 'Error',
          message: 'Invalid username or password',
          color: 'red',
        });
        return;
      }

      // Check if profile setup is needed
      const { data: officer, error: officerError } = await supabase
        .from('officers')
        .select('is_setup_complete')
        .eq('id', user.id)
        .single();

      if (officerError) throw officerError;

      if (!officer?.is_setup_complete) {
        // Redirect to profile setup
        navigate('/profile-setup');
      } else {
        // Navigate to organizations page after successful login
        navigate('/organizations');
      }
      
      notifications.show({
        title: 'Success',
        message: 'Welcome back!',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size={420}>
        <Title ta="center" fw={900}>
          Welcome!
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Enter your credentials to access the dashboard
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Username"
                placeholder="Your username"
                required
                {...form.getInputProps('username')}
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                {...form.getInputProps('password')}
              />

              <Button type="submit" loading={isLoading} fullWidth mt="xl">
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
} 