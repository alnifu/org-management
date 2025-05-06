import { Container, Title, Text, SimpleGrid, Paper, Group, Stack } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { IconUsers, IconBuilding, IconNews } from '@tabler/icons-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <Container size="xl">
      <Title order={1} mb="xl">
        Welcome back, {user?.first_name}!
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconBuilding size={24} color="green" />
            <div>
              <Text size="xs" c="dimmed">
                Organizations
              </Text>
              <Text size="xl" fw={700}>
                1
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <IconUsers size={24} color="green" />
            <div>
              <Text size="xs" c="dimmed">
                Members
              </Text>
              <Text size="xl" fw={700}>
                0
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <IconNews size={24} color="green" />
            <div>
              <Text size="xs" c="dimmed">
                Posts
              </Text>
              <Text size="xl" fw={700}>
                0
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Stack mt="xl">
        <Title order={2}>Recent Activity</Title>
        <Paper withBorder p="md" radius="md">
          <Text c="dimmed" ta="center">
            No recent activity
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
} 