import { useState, useEffect } from 'react';
import {
  Container,
  Text,
  Stack,
  Button,
  Group,
  Card,
  Avatar,
  Loader,
  Center,
  TextInput,
  Modal,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url?: string;
  organization_ids: string[];
  created_at: string;
  updated_at: string;
}

interface OrganizationMembersPageProps {
  organizationId: string;
}

export function OrganizationMembersPage({ organizationId }: OrganizationMembersPageProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [isAddModalOpen, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .contains('organization_ids', [organizationId]);

      if (error) throw error;

      if (!data) {
        setMembers([]);
        return;
      }

      // Get user emails using RPC
      const { data: userEmails, error: emailError } = await supabase
        .rpc('get_user_emails', { user_ids: data.map(m => m.id) });

      if (emailError) {
        console.error('Error fetching emails:', emailError);
      }

      const emailMap = new Map(
        (userEmails as Array<{ id: string; email: string }> || []).map(u => [u.id, u.email])
      );

      const formattedMembers = data.map(member => ({
        ...member,
        email: emailMap.get(member.id) || '',
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      setError(null);
      
      // First, check if the email exists in auth.users using RPC
      const { data: authUser, error: authError } = await supabase
        .rpc('get_user_by_email', { email_param: addMemberEmail });

      if (authError || !authUser || !authUser[0]) {
        setError('No user found with this email address');
        return;
      }

      const userData = authUser[0];

      // Check if member already exists
      const { data: existingMember, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (existingMember) {
        // Update existing member's organization_ids
        const { error: updateError } = await supabase
          .from('members')
          .update({
            organization_ids: [...new Set([...existingMember.organization_ids, organizationId])],
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id);

        if (updateError) throw updateError;
      } else {
        // Create new member
        const { error: insertError } = await supabase
          .from('members')
          .insert({
            id: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            organization_ids: [organizationId],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      closeAddModal();
      setAddMemberEmail('');
      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      setError('An error occurred while adding the member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { data: member, error: fetchError } = await supabase
        .from('members')
        .select('organization_ids')
        .eq('id', memberId)
        .single();

      if (fetchError) throw fetchError;

      const updatedOrganizationIds = member.organization_ids.filter(id => id !== organizationId);

      if (updatedOrganizationIds.length === 0) {
        // If no organizations left, delete the member
        const { error: deleteError } = await supabase
          .from('members')
          .delete()
          .eq('id', memberId);

        if (deleteError) throw deleteError;
      } else {
        // Update the member's organization_ids
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            organization_ids: updatedOrganizationIds,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId);

        if (updateError) throw updateError;
      }

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <TextInput
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        {(user?.is_admin || user?.organization_id === organizationId) && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openAddModal}
          >
            Add Member
          </Button>
        )}
      </Group>

      {members.length === 0 ? (
        <Text c="dimmed" ta="center">
          No members found
        </Text>
      ) : (
        members
          .filter(member => 
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.last_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((member) => (
            <Card key={member.id} withBorder>
              <Group justify="space-between">
                <Group>
                  <Avatar
                    src={member.profile_picture_url}
                    radius="xl"
                  >
                    {member.first_name[0]}{member.last_name[0]}
                  </Avatar>
                  <div>
                    <Text fw={500}>{member.first_name} {member.last_name}</Text>
                    <Text size="sm" c="dimmed">{member.email}</Text>
                  </div>
                </Group>
                {(user?.is_admin || user?.organization_id === organizationId) && (
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>
            </Card>
          ))
      )}

      <Modal
        opened={isAddModalOpen}
        onClose={closeAddModal}
        title="Add Member"
        centered
      >
        <Stack>
          <TextInput
            label="Email"
            placeholder="Enter member's email"
            value={addMemberEmail}
            onChange={(e) => setAddMemberEmail(e.target.value)}
            required
          />
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>
              Add Member
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
} 