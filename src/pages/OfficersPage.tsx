import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Grid,
  TextInput,
  Select,
  Loader,
  Center,
  Pagination,
  ActionIcon,
  Tooltip,
  Modal,
  Table,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconUserCog,
  IconBuilding,
  IconLockOpen,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { OfficerCard } from '../components/OfficerCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatDate';
import { AddOfficerModal } from '../components/AddOfficerModal';

interface Officer {
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
  password: string;
}

export function OfficersPage() {
  const { user } = useAuth();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string | null>('all');
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [officerToDelete, setOfficerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals
  const [adminModalOpened, { open: openAdminModal, close: closeAdminModal }] = useDisclosure(false);
  const [orgModalOpened, { open: openOrgModal, close: closeOrgModal }] = useDisclosure(false);
  const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('officers')
        .select('*');
      
      // Apply filters
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (organizationFilter && organizationFilter !== 'all') {
        query = query.eq('organization_id', organizationFilter);
      }
      
      // Apply pagination
      const from = (currentPage - 1) * 10;
      const to = from + 9;
      query = query.range(from, to).order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Transform the data to include organization_name
      const transformedData = data?.map(officer => ({
        ...officer,
        organization_name: officer.organizations?.name
      })) || [];
      
      setOfficers(transformedData);
      setTotalPages(Math.ceil((count || 0) / 10));
    } catch (error) {
      console.error('Error fetching officers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [currentPage, statusFilter, organizationFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOfficers();
  };

  const shouldDisableActions = (officer: Officer) => {
    const adminCount = officers.filter(o => o.is_admin).length;
    return (officer.is_admin && adminCount <= 1) || officer.id === user?.id;
  };

  const handleDelete = async (officer: Officer) => {
    if (shouldDisableActions(officer)) {
      notifications.show({
        title: 'Error',
        message: officer.id === user?.id 
          ? 'You cannot modify your own account' 
          : 'Cannot modify the last admin account',
        color: 'red',
      });
      return;
    }
    setSelectedOfficer(officer);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!selectedOfficer) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', selectedOfficer.id);

      if (error) throw error;
      fetchOfficers();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting officer:', error);
    } finally {
      setIsProcessing(false);
      setSelectedOfficer(null);
    }
  };

  const handleEdit = (officer: {
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
  }) => {
    // Navigate to edit page or open edit modal
    console.log('Edit officer:', officer);
  };

  const handleSetAdmin = async (officer: Officer) => {
    if (shouldDisableActions(officer)) {
      notifications.show({
        title: 'Error',
        message: officer.id === user?.id 
          ? 'You cannot modify your own account' 
          : 'Cannot modify the last admin account',
        color: 'red',
      });
      return;
    }
    setSelectedOfficer(officer);
    openAdminModal();
  };

  const handleAssignOrg = async (officer: Officer) => {
    if (shouldDisableActions(officer)) {
      notifications.show({
        title: 'Error',
        message: officer.id === user?.id 
          ? 'You cannot modify your own account' 
          : 'Cannot modify the last admin account',
        color: 'red',
      });
      return;
    }
    setSelectedOfficer(officer);
    openOrgModal();
  };

  const handleResetAccount = async (officer: Officer) => {
    if (shouldDisableActions(officer)) {
      notifications.show({
        title: 'Error',
        message: officer.id === user?.id 
          ? 'You cannot modify your own account' 
          : 'Cannot modify the last admin account',
        color: 'red',
      });
      return;
    }
    setSelectedOfficer(officer);
    openResetModal();
  };

  const confirmSetAdmin = async () => {
    if (!selectedOfficer) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('officers')
        .update({ is_admin: !selectedOfficer.is_admin })
        .eq('id', selectedOfficer.id);

      if (error) throw error;
      fetchOfficers();
      closeAdminModal();
    } catch (error) {
      console.error('Error updating admin status:', error);
    } finally {
      setIsProcessing(false);
      setSelectedOfficer(null);
    }
  };

  const confirmAssignOrg = async (orgId: string) => {
    if (!selectedOfficer) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('officers')
        .update({ organization_id: orgId })
        .eq('id', selectedOfficer.id);

      if (error) throw error;
      fetchOfficers();
      closeOrgModal();
    } catch (error) {
      console.error('Error assigning organization:', error);
    } finally {
      setIsProcessing(false);
      setSelectedOfficer(null);
    }
  };

  const confirmResetAccount = async () => {
    if (!selectedOfficer) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('officers')
        .update({ is_setup_complete: false })
        .eq('id', selectedOfficer.id);

      if (error) throw error;
      fetchOfficers();
      closeResetModal();
    } catch (error) {
      console.error('Error resetting account:', error);
    } finally {
      setIsProcessing(false);
      setSelectedOfficer(null);
    }
  };

  const togglePasswordVisibility = (officerId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [officerId]: !prev[officerId]
    }));
  };

  const rows = officers.map((officer) => (
    <Table.Tr key={officer.id}>
      <Table.Td>{officer.first_name} {officer.last_name}</Table.Td>
      <Table.Td>{officer.email}</Table.Td>
      <Table.Td>{officer.username}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          {visiblePasswords[officer.id] ? officer.password : '••••••••'}
          <ActionIcon
            variant="subtle"
            onClick={() => togglePasswordVisibility(officer.id)}
            title={visiblePasswords[officer.id] ? "Hide Password" : "Show Password"}
          >
            {visiblePasswords[officer.id] ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </ActionIcon>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge color={officer.is_admin ? "blue" : "gray"}>
          {officer.is_admin ? "Admin" : "Officer"}
        </Badge>
      </Table.Td>
      <Table.Td>{officer.organization_name}</Table.Td>
      <Table.Td>{formatDate(officer.created_at)}</Table.Td>
      <Table.Td>{formatDate(officer.updated_at)}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleSetAdmin(officer)}
            title="Set as Admin"
            disabled={shouldDisableActions(officer)}
          >
            <IconUserCog size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="green"
            onClick={() => handleAssignOrg(officer)}
            title="Assign Organization"
            disabled={shouldDisableActions(officer)}
          >
            <IconBuilding size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="yellow"
            onClick={() => handleResetAccount(officer)}
            title="Reset Account"
            disabled={shouldDisableActions(officer)}
          >
            <IconLockOpen size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(officer)}
            title="Delete Account"
            disabled={shouldDisableActions(officer)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container py="xl" fluid>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Officers</Title>
          {user?.is_admin && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openAddModal}
            >
              Add Officer
            </Button>
          )}
        </Group>
        
        <Group grow align="flex-start">
          <TextInput
            placeholder="Search officers..."
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
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            leftSection={<IconFilter size={16} />}
          />
          <Select
            placeholder="Filter by organization"
            value={organizationFilter}
            onChange={setOrganizationFilter}
            data={[
              { value: 'all', label: 'All Organizations' },
              ...organizations.map(org => ({
                value: org.id,
                label: org.name
              }))
            ]}
            leftSection={<IconFilter size={16} />}
          />
        </Group>
        
        {loading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : officers.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">No officers found</Text>
              {user?.is_admin && (
                <Button 
                  leftSection={<IconPlus size={16} />}
                  onClick={openAddModal}
                  variant="light"
                >
                  Add Officer
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Username</Table.Th>
                  <Table.Th>Password</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Organization</Table.Th>
                  <Table.Th>Created At</Table.Th>
                  <Table.Th>Updated At</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
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
      
      {/* Set Admin Modal */}
      <Modal
        opened={adminModalOpened}
        onClose={closeAdminModal}
        title="Set Admin Status"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to {selectedOfficer?.is_admin ? 'remove' : 'grant'} admin privileges to {selectedOfficer?.first_name} {selectedOfficer?.last_name}?
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeAdminModal} disabled={isProcessing}>
              Cancel
            </Button>
            <Button color="blue" onClick={confirmSetAdmin} loading={isProcessing}>
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Assign Organization Modal */}
      <Modal
        opened={orgModalOpened}
        onClose={closeOrgModal}
        title="Assign Organization"
        centered
      >
        <Stack>
          <Text>
            Select organization for {selectedOfficer?.first_name} {selectedOfficer?.last_name}:
          </Text>
          <Select
            data={organizations.map(org => ({
              value: org.id,
              label: org.name
            }))}
            value={selectedOfficer?.organization_id}
            onChange={(value) => value && confirmAssignOrg(value)}
            placeholder="Select organization"
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeOrgModal} disabled={isProcessing}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reset Account Modal */}
      <Modal
        opened={resetModalOpened}
        onClose={closeResetModal}
        title="Reset Account"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to reset {selectedOfficer?.first_name} {selectedOfficer?.last_name}'s account? They will need to set up their profile again.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeResetModal} disabled={isProcessing}>
              Cancel
            </Button>
            <Button color="yellow" onClick={confirmResetAccount} loading={isProcessing}>
              Reset
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Account"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete {selectedOfficer?.first_name} {selectedOfficer?.last_name}'s account? This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeDeleteModal} disabled={isProcessing}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={isProcessing}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <AddOfficerModal
        opened={addModalOpened}
        onClose={closeAddModal}
        onSuccess={() => {
          closeAddModal();
          fetchOfficers();
        }}
      />
    </Container>
  );
} 