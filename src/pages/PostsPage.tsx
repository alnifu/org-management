import { useState, useEffect } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
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
  Tabs,
  Card,
  Avatar,
  Badge,
  Textarea,
  FileButton,
  Image,
  Menu,
  Switch,
  NumberInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconRefresh,
  IconCalendar,
  IconLock,
  IconDots,
  IconTrash,
  IconEdit,
  IconEye,
  IconMapPin,
} from '@tabler/icons-react';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDateTime } from '../utils/formatDate';
import { Carousel } from '@mantine/carousel';
import '@mantine/carousel/styles.css';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  event_date: string;
  image_urls: string[];
  is_members_only: boolean;
  likes: number;
  location: string;
  organization_id: string;
  posted_by: string;
  scheduled_publish_date: string;
  updated_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    position_title?: string;
  };
  organization: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

export function PostsPage() {
  const { user } = useAuth();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<{ value: string; label: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [isMembersOnly, setIsMembersOnly] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [isCreateModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;

      setOrganizations(
        data.map(org => ({
          value: org.id,
          label: org.name
        }))
      );
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:officers (
            id,
            first_name,
            last_name,
            profile_picture_url,
            position_title
          ),
          organization:organizations (
            id,
            name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedOrganization) {
        query = query.eq('organization_id', selectedOrganization);
      }

      if (activeTab === 'events') {
        query = query.not('event_date', 'is', null);
      } else if (activeTab === 'members-only') {
        query = query.eq('is_members_only', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (files: File[]) => {
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleCreatePost = async () => {
    try {
      setError(null);

      if (!selectedOrganization) {
        setError('Please select an organization');
        return;
      }

      // First, upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${selectedOrganization}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(filePath, image);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      }

      // Create the post
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          organization_id: selectedOrganization,
          posted_by: user?.id,
          image_urls: imageUrls,
          location,
          event_date: eventDate?.toISOString(),
          is_members_only: isMembersOnly,
          likes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Reset form and close modal
      setTitle('');
      setContent('');
      setLocation('');
      setEventDate(null);
      setIsMembersOnly(false);
      setImages([]);
      setImagePreviews([]);
      closeCreateModal();
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred while creating the post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      // First, get the post to check for images
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('image_urls, organization_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      // Delete images from storage if any
      if (post?.image_urls?.length > 0) {
        for (const url of post.image_urls) {
          const filePath = url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('post-images')
              .remove([`${post.organization_id}/${filePath}`]);
          }
        }
      }

      // Delete the post
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedOrganization, activeTab, routerLocation.key]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    setPostToDelete(postId);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      setIsDeleting(true);
      
      await handleDeletePost(postToDelete);
      
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const handleEdit = (post: {
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
  }) => {
    // Navigate to edit page or open edit modal
    console.log('Edit post:', post);
  };

  const handleLike = async (postId: string) => {
    try {
      // Get current likes count
      const { data, error } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      // Increment likes
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: (data.likes || 0) + 1 })
        .eq('id', postId);
      
      if (updateError) throw updateError;
      
      // Refresh the list
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container py="xl" fluid>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Posts</Title>
          {user?.is_admin && (
            <Button 
              component={Link} 
              to="/posts/new" 
              leftSection={<IconPlus size={16} />}
            >
              Add Post
            </Button>
          )}
        </Group>
        
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">All Posts</Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconCalendar size={16} />}>
              Events
            </Tabs.Tab>
            <Tabs.Tab value="members-only" leftSection={<IconLock size={16} />}>
              Members Only
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
        
        <Group grow align="flex-start">
          <TextInput
            placeholder="Search posts..."
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
            value={selectedOrganization}
            onChange={setSelectedOrganization}
            data={organizations}
            clearable
            style={{ width: 200 }}
          />
        </Group>
        
        {posts.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">No posts found</Text>
              {user?.is_admin && (
                <Button 
                  component={Link} 
                  to="/posts/new" 
                  leftSection={<IconPlus size={16} />}
                  variant="light"
                >
                  Add Post
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <Grid gutter={{ base: 'md', sm: 'lg', lg: 'xl' }}>
            {posts
              .filter(post => 
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.location?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((post) => (
                <Grid.Col key={post.id} span={{ base: 12, sm: 12, md: 6, lg: 6 }}>
                  <Card 
                    withBorder 
                    padding="lg" 
                    radius="md"
                    style={{ 
                      minHeight: '800px',
                      maxHeight: '800px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Card.Section withBorder inheritPadding py="xs">
                      <Group justify="space-between">
                        <Group>
                          <Avatar 
                            src={post.organization.logo_url} 
                            radius="xl" 
                            size="md"
                            color="green"
                          >
                            {post.organization.name.charAt(0)}
                          </Avatar>
                          <div>
                            <Text fw={700} size="lg">
                              {post.organization.name}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {formatDateTime(post.created_at)}
                            </Text>
                          </div>
                        </Group>
                        {user?.is_admin && (
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleDelete(post.id)}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </Group>
                    </Card.Section>

                    {post.image_urls && post.image_urls.length > 0 && (
                      <Card.Section>
                        <Carousel
                          withIndicators
                          height={300}
                          styles={{
                            
                            slide: {
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f8f9fa',
                            },
                          }}
                        >
                          {post.image_urls.map((url, index) => (
                            <Carousel.Slide key={index}>
                              <Image
                                src={url}
                                alt={`Post image ${index + 1}`}
                                height={300}
                                width={300}
                                fit="contain"
                                fallbackSrc="https://placehold.co/600x400?text=No+Image"
                                style={{
                                  objectFit: 'contain',
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                }}
                              />
                            </Carousel.Slide>
                          ))}
                        </Carousel>
                      </Card.Section>
                    )}

                    <Stack mt="md" gap="xs" style={{ flex: 1 }}>
                      <Text fw={500} size="lg">{post.title}</Text>
                      <Text size="sm" lineClamp={3} style={{ flex: 1 }}>{post.content}</Text>
                      
                      {post.event_date && (
                        <Group gap="xs">
                          <IconCalendar size={14} />
                          <Text size="sm">
                            {formatDateTime(post.event_date)}
                          </Text>
                        </Group>
                      )}
                      
                      {post.location && (
                        <Group gap="xs">
                          <IconMapPin size={14} />
                          <Text size="sm">{post.location}</Text>
                        </Group>
                      )}
                      
                      <Group gap="xs" mt="xs">
                        {post.is_members_only && (
                          <Badge color="yellow" variant="light" leftSection={<IconLock size={12} />}>
                            Members Only
                          </Badge>
                        )}
                        <Text size="sm" c="dimmed">
                          {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
          </Grid>
        )}
            
        {posts.length > 0 && (
          <Group justify="center" mt="md">
            <Pagination 
              value={currentPage} 
              onChange={setCurrentPage} 
              total={totalPages} 
              withEdges 
            />
          </Group>
        )}
      </Stack>
      
      <Modal 
        opened={deleteModalOpened} 
        onClose={closeDeleteModal} 
        title="Delete Post"
        centered
      >
        <Stack>
          <Text>Are you sure you want to delete this post? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={isDeleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 