import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Image,
  Grid,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDotsVertical, 
  IconEdit, 
  IconTrash, 
  IconCalendar,
  IconMapPin,
  IconLock,
  IconHeart,
  IconShare,
  IconUser
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    organization_id: string;
    organization_name?: string;
    title: string;
    content: string;
    image_urls?: string[];
    posted_by: string;
    posted_by_name?: string;
    is_members_only: boolean;
    scheduled_publish_date?: string;
    event_date?: string;
    location?: string;
    likes: number;
    created_at: string;
    updated_at: string;
  };
  onEdit?: (post: PostCardProps['post']) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
}

export function PostCard({ post, onEdit, onDelete, onLike }: PostCardProps) {
  const { user } = useAuth();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(post.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = () => {
    if (!onLike) return;
    setIsLiked(!isLiked);
    onLike(post.id);
  };

  const isScheduled = post.scheduled_publish_date && new Date(post.scheduled_publish_date) > new Date();

  return (
    <>
      <Card withBorder padding="lg" radius="md" style={{ width: '100%', overflow: 'hidden' }}>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Group>
              <Avatar 
                radius="xl" 
                size="md"
                color="green"
              >
                {post.organization_name?.charAt(0) || 'O'}
              </Avatar>
              <div>
                <Text fw={700} size="lg">
                  {post.title}
                </Text>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    {post.organization_name}
                  </Text>
                  {post.is_members_only && (
                    <Tooltip label="Members Only">
                      <Badge color="yellow" variant="light" leftSection={<IconLock size={12} />}>
                        Members Only
                      </Badge>
                    </Tooltip>
                  )}
                  {isScheduled && (
                    <Tooltip label={`Scheduled for ${new Date(post.scheduled_publish_date!).toLocaleString()}`}>
                      <Badge color="blue" variant="light" leftSection={<IconCalendar size={12} />}>
                        Scheduled
                      </Badge>
                    </Tooltip>
                  )}
                </Group>
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
                      onClick={() => onEdit(post)}
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

        {post.image_urls && post.image_urls.length > 0 && (
          <Card.Section>
            <Grid>
              {post.image_urls.map((url, index) => (
                <Grid.Col key={index} span={post.image_urls!.length === 1 ? 12 : 6}>
                  <Image
                    src={url}
                    alt={`Post image ${index + 1}`}
                    height={200}
                    fallbackSrc="https://placehold.co/600x400?text=No+Image"
                  />
                </Grid.Col>
              ))}
            </Grid>
          </Card.Section>
        )}

        <Stack mt="md" gap="xs">
          <Text size="sm" lineClamp={3}>
            {post.content}
          </Text>
          
          <Group gap="xs">
            {post.event_date && (
              <Text size="sm">
                <Text span fw={500}><IconCalendar size={14} /> Event Date:</Text> {new Date(post.event_date).toLocaleDateString()}
              </Text>
            )}
            
            {post.location && (
              <Text size="sm">
                <Text span fw={500}><IconMapPin size={14} /> Location:</Text> {post.location}
              </Text>
            )}
          </Group>
          
          <Group gap="xs" mt="xs">
            <Text size="sm" c="dimmed">
              Posted by {post.posted_by_name || 'Unknown'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </Text>
          </Group>
          
          <Group mt="md" gap="xs">
            <Button 
              variant="light" 
              leftSection={<IconHeart size={16} color={isLiked ? 'red' : undefined} />}
              onClick={handleLike}
              fullWidth
            >
              {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
            </Button>
            <Button 
              variant="light" 
              leftSection={<IconShare size={16} />}
              component={Link}
              to={`/posts/${post.id}`}
              fullWidth
            >
              View Details
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal 
        opened={deleteModalOpened} 
        onClose={closeDeleteModal} 
        title="Delete Post"
        centered
      >
        <Text size="sm" mb="md">
          Are you sure you want to delete this post? This action cannot be undone.
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