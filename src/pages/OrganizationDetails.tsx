import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { MemberCard } from '../components/MemberCard';

interface Organization {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  contact_email: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  organization_ids: string[];
  organization_names: string[];
  created_at: string;
  updated_at: string;
}

interface Post {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  image_urls?: string[];
  posted_by: string;
  is_members_only: boolean;
  scheduled_publish_date: string;
  created_at: string;
  updated_at: string;
  event_date?: string;
  location?: string;
  likes: number;
}

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        if (!organization) return;
        
        // Fetch members for this organization
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .contains('organization_ids', [organization.id]);

        if (membersError) throw membersError;

        if (!members) {
          setMembers([]);
          return;
        }

        // Create a function in Supabase to get user emails
        const { data: userEmails, error: emailError } = await supabase
          .rpc('get_user_emails', { user_ids: members.map(m => m.id) });

        if (emailError) {
          console.error('Error fetching emails:', emailError);
        }

        const emailMap = new Map(userEmails?.map((u: { id: string; email: string }) => [u.id, u.email]) || []);

        // Merge data
        const merged = members.map(m => ({
          ...m,
          email: emailMap.get(m.id) || '',
          organization_names: m.organization_ids.map((orgId: string) => {
            if (orgId === organization.id) return organization.name;
            return '';
          }).filter(Boolean)
        }));

        setMembers(merged);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    if (organization) {
      fetchMembers();
    }
  }, [id, organization]);

  // TODO: Implement post fetching
  // TODO: Implement member management
  // TODO: Implement post management

  if (loading) {
    return (
      <Container size="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (!organization) {
    return (
      <Container size="xl">
        <Text>Organization not found</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Paper withBorder p="xl" radius="md" mb="xl">
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
          <Stack>
            {user?.is_admin || user?.organization_id === organization.id ? (
              <Button>Create Post</Button>
            ) : null}

            {posts.length === 0 ? (
              <Text c="dimmed" ta="center">
                No posts found
              </Text>
            ) : (
              posts.map((post) => (
                <div key={post.id}>
                  {/* TODO: Implement post card component */}
                </div>
              ))
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="members" pt="xl">
          <Stack>
            {user?.is_admin || user?.organization_id === organization.id ? (
              <Button>Add Member</Button>
            ) : null}

            {members.length === 0 ? (
              <Text c="dimmed" ta="center">
                No members found
              </Text>
            ) : (
              members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
} 