import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { PostForm } from '../components/PostForm';
import { supabase } from '../lib/supabase';

export function PostFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchPost = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, organizations(*)')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (mounted) {
          // Transform the data to match the form structure
          const transformedData = {
            ...data,
            organization_id: data.organizations?.id,
            scheduled_publish_date: data.scheduled_publish_date ? new Date(data.scheduled_publish_date) : null,
            event_date: data.event_date ? new Date(data.event_date) : null,
          };
          delete transformedData.organizations;

          setPost(transformedData);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        if (mounted) {
          setError('Failed to load post');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      mounted = false;
    };
  }, [id, location.key]);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (id) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update(values)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase
          .from('posts')
          .insert([values]);

        if (error) throw error;
      }

      navigate('/posts', { replace: true });
    } catch (error) {
      console.error('Error saving post:', error);
      setError('Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/posts', { replace: true });
  };

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>
          {id ? 'Edit Post' : 'Create Post'}
        </Title>

        {error && (
          <Alert 
            color="red" 
            title="Error" 
            icon={<IconAlertCircle size={16} />}
          >
            {error}
          </Alert>
        )}

        <Paper withBorder p="md">
          <PostForm
            initialValues={post}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Paper>
      </Stack>
    </Container>
  );
} 