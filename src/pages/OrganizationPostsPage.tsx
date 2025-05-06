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
  Badge,
  TextInput,
  Modal,
  Textarea,
  FileButton,
  Image,
  ActionIcon,
  Menu,
  Switch,
  Grid,
  NumberInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconSearch, IconDots, IconTrash, IconEdit, IconEye, IconCalendar, IconMapPin, IconLock } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
}

interface OrganizationPostsPageProps {
  organizationId: string;
}

export function OrganizationPostsPage({ organizationId }: OrganizationPostsPageProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [isPreviewModalOpen, { open: openPreviewModal, close: closePreviewModal }] = useDisclosure(false);
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

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:officers (
            id,
            first_name,
            last_name,
            profile_picture_url,
            position_title
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

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

      // First, upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${organizationId}/${fileName}`;

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
          organization_id: organizationId,
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
        .select('image_urls')
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
              .remove([`${organizationId}/${filePath}`]);
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
    fetchPosts();
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
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        {(user?.is_admin || user?.organization_id === organizationId) && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateModal}
          >
            Create Post
          </Button>
        )}
      </Group>

      {posts.length === 0 ? (
        <Text c="dimmed" ta="center">
          No posts found
        </Text>
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
                          src={post.author.profile_picture_url}
                          radius="xl"
                        >
                          {post.author.first_name[0]}{post.author.last_name[0]}
                        </Avatar>
                        <div>
                          <Text fw={500}>{post.author.first_name} {post.author.last_name}</Text>
                          {post.author.position_title && (
                            <Text size="sm" c="dimmed">{post.author.position_title}</Text>
                          )}
                          <Text size="sm" c="dimmed">
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </div>
                      </Group>
                      {(user?.is_admin || user?.organization_id === organizationId) && (
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => {
                                setSelectedPost(post);
                                openCreateModal();
                              }}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDeletePost(post.id)}
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
                          {new Date(post.event_date).toLocaleDateString()}
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

      <Modal
        opened={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create Post"
        size="lg"
        centered
      >
        <Stack>
          <TextInput
            label="Title"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Content"
            placeholder="Enter post content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minRows={4}
          />
          <TextInput
            label="Location"
            placeholder="Enter event location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <DatePickerInput
            label="Event Date"
            placeholder="Select event date (optional)"
            value={eventDate}
            onChange={setEventDate}
            clearable
            dropdownType="modal"
            valueFormat="MMMM D, YYYY"
            style={{ width: '100%' }}
            modalProps={{
              centered: true,
              size: 'auto',
              styles: {
                content: {
                  maxWidth: '400px',
                }
              }
            }}
          />
          <Switch
            label="Members Only"
            checked={isMembersOnly}
            onChange={(e) => setIsMembersOnly(e.currentTarget.checked)}
          />
          <FileButton
            onChange={handleImageUpload}
            accept="image/*"
            multiple
          >
            {(props) => <Button {...props}>Upload Images</Button>}
          </FileButton>
          {imagePreviews.length > 0 && (
            <Group>
              {imagePreviews.map((preview, index) => (
                <Image
                  key={index}
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  width={100}
                  height={100}
                  fit="cover"
                />
              ))}
            </Group>
          )}
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              variant="light"
              leftSection={<IconEye size={16} />}
              onClick={() => {
                setSelectedPost({
                  id: 'preview',
                  title,
                  content,
                  created_at: new Date().toISOString(),
                  event_date: eventDate?.toISOString() || '',
                  image_urls: imagePreviews,
                  is_members_only: isMembersOnly,
                  likes: 0,
                  location,
                  organization_id: organizationId,
                  posted_by: user?.id || '',
                  scheduled_publish_date: '',
                  updated_at: new Date().toISOString(),
                  author: {
                    id: user?.id || '',
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    profile_picture_url: user?.profile_picture_url,
                    position_title: user?.position_title
                  }
                });
                closeCreateModal();
                openPreviewModal();
              }}
            >
              Preview
            </Button>
            <Button onClick={handleCreatePost}>
              Create Post
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={isPreviewModalOpen}
        onClose={closePreviewModal}
        title="Post Preview"
        size="lg"
        centered
      >
        {selectedPost && (
          <Stack>
            <Group>
              <Avatar
                src={selectedPost.author.profile_picture_url}
                radius="xl"
              >
                {selectedPost.author.first_name[0]}{selectedPost.author.last_name[0]}
              </Avatar>
              <div>
                <Text fw={500}>{selectedPost.author.first_name} {selectedPost.author.last_name}</Text>
                {selectedPost.author.position_title && (
                  <Text size="sm" c="dimmed">{selectedPost.author.position_title}</Text>
                )}
                <Text size="sm" c="dimmed">
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </Text>
              </div>
            </Group>
            <Text fw={500} size="lg">{selectedPost.title}</Text>
            <Text>{selectedPost.content}</Text>
            {selectedPost.image_urls && selectedPost.image_urls.length > 0 && (
              <Group>
                {selectedPost.image_urls.map((url, index) => (
                  <Image 
                    key={index} 
                    src={url} 
                    alt={`Post image ${index + 1}`}
                    width={200}
                    height={200}
                    fit="cover"
                    radius="md"
                  />
                ))}
              </Group>
            )}
            {selectedPost.location && (
              <Group gap="xs">
                <Text size="sm" c="dimmed">Location:</Text>
                <Text size="sm">{selectedPost.location}</Text>
              </Group>
            )}
            {selectedPost.event_date && (
              <Group gap="xs">
                <Text size="sm" c="dimmed">Event Date:</Text>
                <Text size="sm">{new Date(selectedPost.event_date).toLocaleDateString()}</Text>
              </Group>
            )}
            <Group>
              <Text size="sm" c="dimmed">
                {selectedPost.likes} likes
              </Text>
              {selectedPost.is_members_only && (
                <Badge color="blue">Members Only</Badge>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
} 