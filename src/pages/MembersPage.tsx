import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    TextInput,
    Select,
    Loader,
    Center,
    Pagination,
    ActionIcon,
    Table,
    Badge,
} from '@mantine/core';
import {
    IconSearch,
    IconFilter,
    IconRefresh,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatDate';

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

export function MembersPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [organizationFilter, setOrganizationFilter] = useState<string | null>('all');
    const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrganizations = async () => {
        let mounted = true;
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name')
                .order('name');

            if (error) throw error;

            if (mounted) {
                setOrganizations(data || []);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        }
        return () => {
            mounted = false;
        };
    };

    const fetchMembers = async () => {
        let mounted = true;
        setLoading(true);
        try {
            // 1. Fetch members
            let query = supabase
                .from('members')
                .select('*', { count: 'exact' });

            // Apply filters
            if (searchQuery) {
                query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
            }

            if (organizationFilter && organizationFilter !== 'all') {
                query = query.contains('organization_ids', [organizationFilter]);
            }

            // Apply pagination
            const from = (currentPage - 1) * 10;
            const to = from + 9;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data: members, error, count } = await query;
            if (error) throw error;

            if (!members) {
                if (mounted) {
                    setMembers([]);
                    setTotalPages(1);
                }
                return;
            }

            // 2. Create a function in Supabase to get user emails
            const { data: userEmails, error: emailError } = await supabase
                .rpc('get_user_emails', { user_ids: members.map(m => m.id) });

            if (emailError) {
                console.error('Error fetching emails:', emailError);
            }

            const emailMap = new Map(userEmails?.map((u: { id: string; email: string }) => [u.id, u.email]) || []);

            // 3. Merge data
            const merged = members.map(m => ({
                ...m,
                email: emailMap.get(m.id) || '',
                organization_names: m.organization_ids.map((id: string) => {
                    const org = organizations.find(o => o.id === id);
                    return org ? org.name : '';
                }).filter(Boolean)
            }));

            if (mounted) {
                setMembers(merged);
                setTotalPages(Math.ceil((count || 0) / 10));
            }
        } catch (error) {
            console.error('Error fetching members:', error);
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
    }, []);

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            if (mounted) {
                await fetchMembers();
            }
        };
        loadData();
        return () => {
            mounted = false;
        };
    }, [currentPage, organizationFilter]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchMembers();
    };

    const rows = members.map((member) => (
        <Table.Tr key={member.id}>
            <Table.Td>{member.first_name} {member.last_name}</Table.Td>
            <Table.Td>{member.email}</Table.Td>
            <Table.Td>
                {member.organization_names.length > 0 ? (
                    <Group gap="xs">
                        {member.organization_names.map((org, index) => (
                            <Badge key={index} color="blue" variant="light">
                                {org}
                            </Badge>
                        ))}
                    </Group>
                ) : (
                    <Badge color="gray" variant="light">No Organizations</Badge>
                )}
            </Table.Td>
            <Table.Td>{formatDate(member.created_at)}</Table.Td>
            <Table.Td>{formatDate(member.updated_at)}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container py="xl" fluid>
            <Stack gap="lg">
                <Group justify="space-between">
                    <Title order={1}>Members</Title>
                </Group>

                <Group grow align="flex-start">
                    <TextInput
                        placeholder="Search members..."
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
                ) : members.length === 0 ? (
                    <Center h={200}>
                        <Stack align="center" gap="md">
                            <Text size="lg" c="dimmed">No members found</Text>
                        </Stack>
                    </Center>
                ) : (
                    <>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Organizations</Table.Th>
                                    <Table.Th>Created At</Table.Th>
                                    <Table.Th>Updated At</Table.Th>
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
        </Container>
    );
}