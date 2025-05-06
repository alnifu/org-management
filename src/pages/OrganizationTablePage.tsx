import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Table,
  TextInput,
  ActionIcon,
  Loader,
  Center,
  Pagination,
  Tooltip,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconRefresh, IconTrash, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export function OrganizationTablePage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const fetchOrganizations = async () => {
    let mounted = true;
    setLoading(true);
    try {
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' });
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const from = (currentPage - 1) * 10;
      const to = from + 9;
      query = query.range(from, to).order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (mounted) {
        setOrganizations(data || []);
        setTotalPages(Math.ceil((count || 0) / 10));
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (mounted) {
        await fetchOrganizations();
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrganizations();
  };

  const handleDelete = (organization: Organization) => {
    setOrganizationToDelete(organization);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!organizationToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete related records first
      await supabase.from('posts').delete().eq('organization_id', organizationToDelete.id);
      await supabase.from('officers').delete().eq('organization_id', organizationToDelete.id);
      
      // Delete the organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationToDelete.id);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchOrganizations();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting organization:', error);
    } finally {
      setIsDeleting(false);
      setOrganizationToDelete(null);
    }
  };

  const handleEditStart = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditEmail(org.contact_email);
  };

  const handleEditCancel = () => {
    setEditingOrg(null);
    setEditName('');
    setEditEmail('');
  };

  const handleEditSave = async () => {
    if (!editingOrg) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: editName,
          contact_email: editEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOrg.id);

      if (error) throw error;

      await fetchOrganizations();
      handleEditCancel();
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  if (!user?.is_admin) {
    return (
      <Container py="xl">
        <Text>Access denied. Admin privileges required.</Text>
      </Container>
    );
  }

  return (
    <Container py="xl" fluid>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Organizations</Title>
          <Button 
            component={Link} 
            to="/organizations/new" 
            leftSection={<IconPlus size={16} />}
          >
            Add Organization
          </Button>
        </Group>
        
        <Group grow align="flex-start">
          <TextInput
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            rightSection={
              <ActionIcon variant="subtle" onClick={handleSearch}>
                <IconRefresh size={16} />
              </ActionIcon>
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </Group>
        
        {loading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : organizations.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">No organizations found</Text>
              <Button 
                component={Link} 
                to="/organizations/new" 
                leftSection={<IconPlus size={16} />}
                variant="light"
              >
                Add Organization
              </Button>
            </Stack>
          </Center>
        ) : (
          <>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '30%' }}>Name</Table.Th>
                  <Table.Th style={{ width: '30%' }}>Contact Email</Table.Th>
                  <Table.Th style={{ width: '15%' }}>Created</Table.Th>
                  <Table.Th style={{ width: '15%' }}>Updated</Table.Th>
                  <Table.Th style={{ width: '10%' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {organizations.map((org) => (
                  <Table.Tr key={org.id}>
                    <Table.Td style={{ width: '30%' }}>
                      {editingOrg?.id === org.id ? (
                        <TextInput
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          size="xs"
                        />
                      ) : (
                        org.name
                      )}
                    </Table.Td>
                    <Table.Td style={{ width: '30%' }}>
                      {editingOrg?.id === org.id ? (
                        <TextInput
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          size="xs"
                        />
                      ) : (
                        org.contact_email
                      )}
                    </Table.Td>
                    <Table.Td style={{ width: '15%' }}>{new Date(org.created_at).toLocaleDateString()}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{new Date(org.updated_at).toLocaleDateString()}</Table.Td>
                    <Table.Td style={{ width: '10%' }}>
                      <Group gap="xs">
                        {editingOrg?.id === org.id ? (
                          <>
                            <Tooltip label="Save">
                              <ActionIcon 
                                color="green" 
                                variant="subtle"
                                onClick={handleEditSave}
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Cancel">
                              <ActionIcon 
                                variant="subtle"
                                onClick={handleEditCancel}
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip label="Edit">
                              <ActionIcon 
                                variant="subtle"
                                onClick={() => handleEditStart(org)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <ActionIcon 
                                color="red" 
                                variant="subtle"
                                onClick={() => handleDelete(org)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            
            <Group justify="center" mt="md">
              <Pagination 
                value={currentPage} 
                onChange={setCurrentPage} 
                total={totalPages} 
                withEdges 
              />
            </Group>
          </>
        )}
      </Stack>
      
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Organization"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete the organization "{organizationToDelete?.name}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={isDeleting}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 