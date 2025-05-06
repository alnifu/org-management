import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Tabs,
  Button,
  Paper,
  Avatar,
  Loader,
  Center,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { OrganizationPostsPage } from './OrganizationPostsPage';
import { OrganizationMembersPage } from './OrganizationMembersPage';

interface Organization {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export function OrganizationViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrganization(data);
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id]);

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!organization) {
    return (
      <Container py="xl">
        <Text>Organization not found</Text>
      </Container>
    );
  }

  return (
    <Container py="xl" fluid>
      <Stack gap="lg">
        <Group>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Group>

        <Paper withBorder p="xl" radius="md">
          <Group>
            <Avatar
              src={organization.logo_url}
              size={80}
              radius="md"
            >
              {organization.name[0]}
            </Avatar>
            <div>
              <Title order={2}>{organization.name}</Title>
              <Text c="dimmed">{organization.description}</Text>
            </div>
          </Group>
        </Paper>

        <Tabs defaultValue="posts">
          <Tabs.List>
            <Tabs.Tab value="posts">Posts</Tabs.Tab>
            <Tabs.Tab value="members">Members</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="posts" pt="xl">
            <OrganizationPostsPage organizationId={organization.id} />
          </Tabs.Panel>

          <Tabs.Panel value="members" pt="xl">
            <OrganizationMembersPage organizationId={organization.id} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
} 