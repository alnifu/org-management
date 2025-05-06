import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  Textarea,
  Button,
  Paper,
  Avatar,
  FileButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      position_title: user?.position_title || '',
      bio: user?.bio || '',
    },
    validate: {
      first_name: (value) => (!value ? 'First name is required' : null),
      last_name: (value) => (!value ? 'Last name is required' : null),
      email: (value) => (!value ? 'Email is required' : null),
      position_title: (value) => (!value ? 'Position title is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);

      let profile_picture_url = user?.profile_picture_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        profile_picture_url = publicUrl;
      }

      await updateProfile({
        ...values,
        profile_picture_url,
      });

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm">
      <Title order={1} mb="xl">
        Profile Settings
      </Title>

      <Paper withBorder p="xl" radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Group justify="center">
              <Avatar
                src={user?.profile_picture_url}
                size={150}
                radius={75}
              >
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </Avatar>
            </Group>

            <TextInput
              label="First Name"
              placeholder="Enter first name"
              required
              {...form.getInputProps('first_name')}
            />

            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              required
              {...form.getInputProps('last_name')}
            />

            <TextInput
              label="Email"
              placeholder="Enter email"
              required
              {...form.getInputProps('email')}
            />

            <Textarea
              label="Bio"
              placeholder="Enter bio"
              {...form.getInputProps('bio')}
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 