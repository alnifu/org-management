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
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDotsVertical, 
  IconEdit, 
  IconTrash, 
  IconMail,
  IconBuilding,
  IconUsers
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatDate';

interface MemberCardProps {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    organization_ids: string[];
    organization_names: string[];
    created_at: string;
    updated_at: string;
  };
  onEdit?: (member: MemberCardProps['member']) => void;
  onDelete?: (memberId: string) => void;
}

export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const { user } = useAuth();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(member.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting member:', error);
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
                radius="xl" 
                size="lg"
                color="blue"
              >
                {member.first_name.charAt(0)}
                {member.last_name.charAt(0)}
              </Avatar>
              <div>
                <Text fw={700} size="lg">
                  {member.first_name} {member.last_name}
                </Text>
                <Badge color="blue" variant="light">
                  Member
                </Badge>
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
                      onClick={() => onEdit(member)}
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
            <Text span fw={500}>Email:</Text> {member.email}
          </Text>
          
          <Text size="sm">
            <Text span fw={500}>Organizations:</Text>
            <Group gap="xs" mt={4}>
              {member.organization_names.length > 0 ? (
                member.organization_names.map((orgName, index) => (
                  <Tooltip key={index} label={orgName}>
                    <Badge variant="outline" color="blue">
                      {orgName.length > 15 ? `${orgName.substring(0, 15)}...` : orgName}
                    </Badge>
                  </Tooltip>
                ))
              ) : (
                <Badge color="gray" variant="light">No Organizations</Badge>
              )}
            </Group>
          </Text>
          
          <Text size="sm">
            <Text span fw={500}>Created:</Text> {formatDate(member.created_at)}
          </Text>
          
          <Text size="sm">
            <Text span fw={500}>Updated:</Text> {formatDate(member.updated_at)}
          </Text>
          
          <Group mt="md" gap="xs">
            <Button 
              variant="light" 
              leftSection={<IconMail size={16} />}
              component="a"
              href={`mailto:${member.email}`}
              fullWidth
            >
              Contact
            </Button>
            {member.organization_ids.length > 0 && (
              <Button 
                variant="light" 
                leftSection={<IconBuilding size={16} />}
                component="a"
                href={`/organizations/${member.organization_ids[0]}`}
                fullWidth
              >
                View Organization
              </Button>
            )}
          </Group>
        </Stack>
      </Card>

      <Modal 
        opened={deleteModalOpened} 
        onClose={closeDeleteModal} 
        title="Delete Member"
        centered
      >
        <Text size="sm" mb="md">
          Are you sure you want to delete {member.first_name} {member.last_name}? This action cannot be undone.
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