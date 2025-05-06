import {
      Container,
      Title,
      Stack,
      Grid,
      Card,
      Text,
      AspectRatio,
      Image,
      Paper,
    } from '@mantine/core';
    
    // Simple placeholder card data
    const placeholderItems = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `Test Card ${i + 1}`,
      description: 'This is a placeholder card to test layout behavior.',
    }));
    
    // Simple Placeholder Card Component
    function PlaceholderCard({ item }: { item: { id: number; title: string; description: string } }) {
      return (
        <Card withBorder padding="lg" radius="md" style={{ width: '100%', overflow: 'hidden' }}>
          <Card.Section>
            <AspectRatio ratio={16 / 9}>
              <Image src={`https://picsum.photos/seed/${item.id}/300/200`} alt={item.title} />
            </AspectRatio>
          </Card.Section>
          <Stack mt="md">
            <Title order={4}>{item.title}</Title>
            <Text size="sm">{item.description}</Text>
          </Stack>
        </Card>
      );
    }
    
    export function TestLayoutPage() {
      return (
        <Container fluid>
          <Stack gap="lg">
            <Title order={1}>Test Layout Page</Title>
            <Text>This page is for testing layout configurations.</Text>
    
            <Paper withBorder p="md" shadow="xs">
              <Title order={3} mb="md">Test Scenario: Grid with Gutters</Title>
              <Grid gutter="lg">
                {placeholderItems.map((item) => (
                  <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                    <PlaceholderCard item={item} />
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
    
             <Paper withBorder p="md" shadow="xs" mt="xl">
              <Title order={3} mb="md">Test Scenario: Grid without Gutters</Title>
              <Grid>
                {placeholderItems.map((item) => (
                  <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                    <PlaceholderCard item={item} />
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
    
            {/* Add more test scenarios here as needed */}
    
          </Stack>
        </Container>
      );
    } 