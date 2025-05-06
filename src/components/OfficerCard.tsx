import { useState } from 'react';
import {
  Card,
  Text,
  Group,
  Badge,
  Button,
  ActionIcon,
  Menu,
  Avatar,
  Stack,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDotsVertical, 
  IconEdit, 
  IconTrash, 
  IconMail,
  IconBuilding
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface OfficerCardProps {
  officer: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    position_title: string;
    organization_id: string;
    organization_name?: string;
    is_admin: boolean;
    status: 'active' | 'inactive';
    bio?: string;
    profile_picture_url?: string;
    created_at: string;
    updated_at: string;
  };
  onEdit?: (officer: OfficerCardProps['officer']) => void;
  onDelete?: (officerId: string) => void;
}

export function OfficerCard({ officer, onEdit, onDelete }: OfficerCardProps) {
  const { user } = useAuth();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(officer.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting officer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card withBorder padding="lg" radius="md" style={{ width: '100%', overflow: 'hidden' }}>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Group>
              <Avatar 
                src={officer.profile_picture_url} 
                radius="xl" 
                size="lg"
                color="green"
              >
                {officer.first_name.charAt(0)}
                {officer.last_name.charAt(0)}
              </Avatar>
              <div>
                <Text fw={700} size="lg">
                  {officer.first_name} {officer.last_name}
                </Text>
                <Group gap="xs">
                  <Badge 
                    color={officer.status === 'active' ? 'green' : 'gray'}
                    variant="light"
                  >
                    {officer.status}
                  </Badge>
                  {officer.is_admin && (
                    <Badge color="blue" variant="light">
                      Admin
                    </Badge>
                  )}
                </Group>
              </div>
            </Group>
            
            {user?.is_admin && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="subtle">
                    <IconDotsVertical size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {onEdit && (
                    <Menu.Item 
                      leftSection={<IconEdit size={14} />}
                      onClick={() => onEdit(officer)}
                    >
                      Edit
                    </Menu.Item>
                  )}
                  {onDelete && (
                    <Menu.Item 
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={openDeleteModal}
                    >
                      Delete
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Card.Section>

        <Stack mt="md" gap="xs">
          <Text size="sm">
            <Text span fw={500}>Position:</Text> {officer.position_title}
          </Text>
          
          <Text size="sm">
            <Text span fw={500}>Organization:</Text> {officer.organization_name || 'N/A'}
          </Text>
          
          <Text size="sm">
            <Text span fw={500}>Username:</Text> {officer.username}
          </Text>
          
          <Text size="sm">
            <Text span fw={500}>Email:</Text> {officer.email}
          </Text>
          
          {officer.bio && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {officer.bio}
            </Text>
          )}
          
          <Group mt="md" gap="xs">
            <Button 
              variant="light" 
              leftSection={<IconMail size={16} />}
              component="a"
              href={`mailto:${officer.email}`}
              fullWidth
            >
              Contact
            </Button>
            <Button 
              variant="light" 
              leftSection={<IconBuilding size={16} />}
              component="a"
              href={`/organizations/${officer.organization_id}`}
              fullWidth
            >
              View Organization
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal 
        opened={deleteModalOpened} 
        onClose={closeDeleteModal} 
        title="Delete Officer"
        centered
      >
        <Text size="sm" mb="md">
          Are you sure you want to delete {officer.first_name} {officer.last_name}? This action cannot be undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={handleDelete}
            loading={isDeleting}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
} 