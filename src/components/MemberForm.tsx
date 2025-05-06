import { useState, useEffect } from 'react';
import {
  TextInput,
  Textarea,
  FileInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Image,
  Box,
  LoadingOverlay,
  MultiSelect,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUpload } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

interface MemberFormProps {
  initialValues?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    organization_ids?: string[];
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MemberForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MemberFormProps) {
  const [organizations, setOrganizations] = useState<{ value: string; label: string; }[]>([]);

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
      first_name: '',
      last_name: '',
      email: '',
      organization_ids: [],
      ...initialValues,
    },
    validate: {
      first_name: (value) => (!value ? 'First name is required' : null),
      last_name: (value) => (!value ? 'Last name is required' : null),
      email: (value) =>
        !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
      organization_ids: (value) =>
        !value.length ? 'At least one organization is required' : null,
    },
  });

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
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

          <MultiSelect
            required
            label="Organizations"
            placeholder="Select organizations"
            data={organizations}
            {...form.getInputProps('organization_ids')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {initialValues.first_name ? 'Update' : 'Create'} Member
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
} 