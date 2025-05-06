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
  Loader,
  Center,
  Pagination,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconSearch, IconRefresh } from '@tabler/icons-react';
import { OrganizationCard } from '../components/OrganizationCard';
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

export function OrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      
      const from = (currentPage - 1) * 12;
      const to = from + 11;
      query = query.range(from, to).order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (mounted) {
        setOrganizations(data || []);
        setTotalPages(Math.ceil((count || 0) / 12));
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

  return (
    <Container py="xl" fluid>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Organizations</Title>
          {user?.is_admin && (
            <Button 
              component={Link} 
              to="/organizations/new" 
              leftSection={<IconPlus size={16} />}
            >
              Add Organization
            </Button>
          )}
        </Group>
        
        <Group>
          <TextInput
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              {user?.is_admin && (
                <Button 
                  component={Link} 
                  to="/organizations/new" 
                  leftSection={<IconPlus size={16} />}
                  variant="light"
                >
                  Add Organization
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <>
            <Grid gutter={{ base: 'md', sm: 'lg', lg: 'xl' }}>
              {organizations.map((organization) => (
                <Grid.Col key={organization.id} span={{ base: 12, sm: 12, md: 6, lg: 6 }}>
                  <OrganizationCard organization={organization} />
                </Grid.Col>
              ))}
            </Grid>
            
            <Group justify="center">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
              />
            </Group>
          </>
        )}
      </Stack>
    </Container>
  );
} 