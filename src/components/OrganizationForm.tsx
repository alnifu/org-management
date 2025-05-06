import { useForm } from '@mantine/form';
import {
  TextInput,
  Textarea,
  Button,
  Stack,
  FileButton,
  Group,
  Image,
  Box,
  Container,
  Title,
  Alert,
} from '@mantine/core';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ImageCropper } from './ImageCropper';
import { useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  description: string;
  contact_email: string;
  logo_url: string | null;
}

interface OrganizationFormProps {
  organization?: Organization;
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropperOpened, setCropperOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      name: organization?.name || '',
      description: organization?.description || '',
      contact_email: organization?.contact_email || '',
      logo_url: organization?.logo_url || '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
      contact_email: (value) => (!value ? 'Email is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let logoUrl = values.logo_url;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      const organizationData = {
        name: values.name,
        description: values.description,
        contact_email: values.contact_email,
        logo_url: logoUrl,
      };

      if (organization) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update(organizationData)
          .eq('id', organization.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('organizations')
          .insert(organizationData);

        if (insertError) throw insertError;
      }

      navigate('/organizations');
    } catch (err) {
      console.error('Error saving organization:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setLogoFile(file);
      setCropperOpened(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    setLogoPreview(croppedImage);
    // Convert base64 to File object
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        setLogoFile(file);
      });
  };

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="xl">
        {organization ? 'Edit Organization' : 'Create Organization'}
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Box maw={200}>
          {logoPreview && (
              <Box mt="md" mb="xl"  >
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              </Box>
            )}
            <FileButton
              onChange={handleLogoChange}
              accept="image/png,image/jpeg"
            >
              {(props) => (
                <Button {...props} variant="light" fullWidth>
                  Upload Logo
                </Button>
              )}
            </FileButton>
            
          </Box>

          <TextInput
            label="Name"
            placeholder="Enter organization name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Enter organization description"
            required
            minRows={3}
            {...form.getInputProps('description')}
          />

          <TextInput
            label="Contact Email"
            placeholder="Enter contact email"
            required
            type="email"
            {...form.getInputProps('contact_email')}
          />

          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => navigate('/organizations')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {organization ? 'Update' : 'Create'} Organization
            </Button>
          </Group>
        </Stack>
      </form>

      <ImageCropper
        opened={cropperOpened}
        onClose={() => setCropperOpened(false)}
        image={logoPreview || ''}
        onCropComplete={handleCropComplete}
      />
    </Container>
  );
} 