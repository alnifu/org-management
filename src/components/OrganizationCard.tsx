import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Text,
  Group,
  Button,
  Avatar,
  Stack,
  Modal,
  Textarea,
  Box,
  ActionIcon,
  TextInput,
} from '@mantine/core';
import { IconEdit, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ImageCropper } from './ImageCropper';

interface OrganizationCardProps {
  organization: {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    contact_email: string;
    created_at: string;
    updated_at: string;
  };
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState(organization.description);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [name, setName] = useState(organization.name);
  const [contactEmail, setContactEmail] = useState(organization.contact_email);

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      setShowExpandButton(element.scrollHeight > element.clientHeight);
    }
  }, [organization.description]);

  const handleEdit = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      let logoUrl = organization.logo_url;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
        const filePath = `organization-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          name,
          contact_email: contactEmail,
          description,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Error updating organization:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating the organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setLogoFile(file);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    // First set the preview
    setLogoPreview(croppedImage);
    
    // Then convert and set the file
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        setLogoFile(file);
      })
      .catch(err => {
        console.error('Error converting cropped image:', err);
        setError('Failed to process the cropped image');
      });
  };

  // Only show card if user is admin or assigned to the organization
  if (!user?.is_admin && user?.organization_id !== organization.id) {
    return null;
  }

  return (
    <>
      <Card withBorder padding="lg" radius="md" style={{ width: '100%', overflow: 'hidden', minHeight: '300px', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Group>
              <Avatar 
                src={logoPreview || organization.logo_url} 
                radius="30" 
                size="60"
                color="green"
              >
                {organization.name.charAt(0)}
              </Avatar>
              <div>
                <Text fw={700} size="lg">
                  {organization.name}
                </Text>
              </div>
            </Group>
            
            {(user?.is_admin || user?.organization_id === organization.id) && (
              <ActionIcon
                variant="light"
                color="blue"
                radius="md"
                onClick={() => setIsEditModalOpen(true)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            )}
          </Group>
        </Card.Section>

        <Stack justify="space-between" style={{ flex: 1, paddingTop: '10px', paddingBottom: '20px' }}>
          <Box>
            <Text 
              ref={textRef}
              size="sm" 
              c="dimmed" 
              lineClamp={isExpanded ? undefined : 5}
              style={{ 
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word'
              }}
            >
              {organization.description}
            </Text>
            {showExpandButton && (
              <Button
                variant="subtle"
                size="xs"
                rightSection={isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ padding: '4px 0' }}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </Box>
          
          <Button 
            component={Link} 
            to={`/organizations/${organization.id}`}
            variant="light" 
            fullWidth
          >
            View Organization
          </Button>
        </Stack>
      </Card>

      <Modal
        opened={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          // Reset the preview and file when closing the modal
          setLogoPreview(null);
          setLogoFile(null);
          setName(organization.name);
          setContactEmail(organization.contact_email);
          setDescription(organization.description);
        }}
        title="Edit Organization"
        centered
        size="xl"
        styles={{
          content: {
            maxWidth: '800px'
          }
        }}
      >
        <Stack gap="md">
          <Box maw={200}>
            <Box mt="md" mb="xl">
              <img
                src={logoPreview || organization.logo_url}
                alt="Logo preview"
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            </Box>
            <Button
              variant="light"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png,image/jpeg';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleLogoChange(file);
                  }
                };
                input.click();
              }}
            >
              Upload Logo
            </Button>
          </Box>

          <TextInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <TextInput
            label="Contact Email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.currentTarget.value)}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={8}
            autosize
            maxRows={12}
            style={{ minHeight: '200px' }}
          />

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                setIsEditModalOpen(false);
                // Reset the preview and file when canceling
                setLogoPreview(null);
                setLogoFile(null);
                setName(organization.name);
                setContactEmail(organization.contact_email);
                setDescription(organization.description);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              loading={isLoading}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ImageCropper
        opened={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false);
          // Only clear the preview and file if we haven't completed the crop
          if (!logoPreview) {
            setLogoFile(null);
          }
        }}
        image={logoPreview || ''}
        onCropComplete={handleCropComplete}
      />
    </>
  );
} 