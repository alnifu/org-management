import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  FileInput,
  Switch,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

interface OfficerFormProps {
  initialValues?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    position_title?: string;
    organization_id?: string;
    is_admin?: boolean;
    profile_picture_url?: string;
    status?: string;
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OfficerForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: OfficerFormProps) {
  const [organizations, setOrganizations] = useState<{ value: string; label: string; }[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;

      setOrganizations(
        data.map((org) => ({
          value: org.id,
          label: org.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const form = useForm({
    initialValues: {
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      position_title: '',
      organization_id: '',
      is_admin: false,
      profile_picture_url: '',
      status: 'active',
      ...initialValues,
    },
    validate: {
      username: (value) => (!value ? 'Username is required' : null),
      first_name: (value) => (!value ? 'First name is required' : null),
      last_name: (value) => (!value ? 'Last name is required' : null),
      email: (value) =>
        !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
      position_title: (value) => (!value ? 'Position title is required' : null),
      organization_id: (value) => (!value ? 'Organization is required' : null),
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      let profile_picture_url = values.profile_picture_url;

      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `officer-profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, profilePicture);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        profile_picture_url = publicUrl;
      }

      await onSubmit({ ...values, profile_picture_url });
    } catch (error) {
      console.error('Error handling form submission:', error);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          required
          label="Username"
          placeholder="Enter username"
          {...form.getInputProps('username')}
        />

        <Group grow>
          <TextInput
            required
            label="First Name"
            placeholder="Enter first name"
            {...form.getInputProps('first_name')}
          />

          <TextInput
            required
            label="Last Name"
            placeholder="Enter last name"
            {...form.getInputProps('last_name')}
          />
        </Group>

        <TextInput
          required
          label="Email"
          placeholder="Enter email address"
          {...form.getInputProps('email')}
        />

        <TextInput
          required
          label="Position Title"
          placeholder="Enter position title"
          {...form.getInputProps('position_title')}
        />

        <Select
          required
          label="Organization"
          placeholder="Select organization"
          data={organizations}
          {...form.getInputProps('organization_id')}
        />

        <FileInput
          label="Profile Picture"
          placeholder="Upload profile picture"
          accept="image/*"
          leftSection={<IconUpload size={14} />}
          value={profilePicture}
          onChange={setProfilePicture}
        />

        <Switch
          label="Admin Access"
          description="Grant administrative privileges to this officer"
          {...form.getInputProps('is_admin', { type: 'checkbox' })}
        />

        <Select
          label="Status"
          data={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ]}
          {...form.getInputProps('status')}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {initialValues.username ? 'Update' : 'Create'} Officer
          </Button>
        </Group>
      </Stack>
    </form>
  );
} 