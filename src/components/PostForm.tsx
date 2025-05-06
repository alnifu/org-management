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
  Switch,
  Grid,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates'; // Make sure to import this
import { useForm } from '@mantine/form';
import { IconUpload } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

interface PostFormProps {
  initialValues?: {
    title?: string;
    content?: string;
    organization_id?: string;
    image_urls?: string[];
    is_members_only?: boolean;
    scheduled_publish_date?: Date | null;
    event_date?: Date | null;
    location?: string;
    status?: string;
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PostForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PostFormProps) {
  const [organizations, setOrganizations] = useState<{ value: string; label: string; }[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

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
      title: '',
      content: '',
      organization_id: '',
      image_urls: [],
      is_members_only: false,
      scheduled_publish_date: null,
      event_date: null,
      location: '',
      status: 'draft',
      ...initialValues,
    },
    validate: {
      title: (value) => (!value ? 'Title is required' : null),
      content: (value) => (!value ? 'Content is required' : null),
      organization_id: (value) => (!value ? 'Organization is required' : null),
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      let image_urls = values.image_urls || [];

      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `post-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('public')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(filePath);

          return publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        image_urls = [...image_urls, ...uploadedUrls];
      }

      await onSubmit({
        ...values,
        image_urls,
        scheduled_publish_date: values.scheduled_publish_date?.toISOString(),
        event_date: values.event_date?.toISOString(),
      });
    } catch (error) {
      console.error('Error handling form submission:', error);
    }
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            required
            label="Title"
            placeholder="Enter post title"
            {...form.getInputProps('title')}
          />

          <Select
            required
            label="Organization"
            placeholder="Select organization"
            data={organizations}
            {...form.getInputProps('organization_id')}
          />

          <Textarea
            required
            label="Content"
            placeholder="Enter post content"
            minRows={4}
            {...form.getInputProps('content')}
          />

          <FileInput
            label="Images"
            placeholder="Upload post images"
            accept="image/*"
            multiple
            value={imageFiles}
            onChange={setImageFiles}
            leftSection={<IconUpload size={14} />}
          />

          <Switch
            label="Members Only"
            description="Make this post visible only to organization members"
            {...form.getInputProps('is_members_only', { type: 'checkbox' })}
          />

          <DateTimePicker
            label="Schedule Publish Date"
            placeholder="Select date and time"
            {...form.getInputProps('scheduled_publish_date')}
          />

          <DateTimePicker
            label="Event Date"
            placeholder="Select event date and time"
            {...form.getInputProps('event_date')}
          />

          <TextInput
            label="Location"
            placeholder="Enter event location"
            {...form.getInputProps('location')}
          />

          <Select
            label="Status"
            data={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
            {...form.getInputProps('status')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {initialValues.title ? 'Update' : 'Create'} Post
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}