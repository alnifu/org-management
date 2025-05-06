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
import { MemberForm } from '../components/MemberForm';
import { supabase } from '../lib/supabase';

export function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchMember = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (mounted) {
          setMember(data);
        }
      } catch (error) {
        console.error('Error fetching member:', error);
        if (mounted) {
          setError('Failed to load member');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMember();

    return () => {
      mounted = false;
    };
  }, [id, location.key]);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (id) {
        // Update existing member
        const { error } = await supabase
          .from('members')
          .update(values)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new member
        const { error } = await supabase
          .from('members')
          .insert([values]);

        if (error) throw error;
      }

      navigate('/members', { replace: true });
    } catch (error) {
      console.error('Error saving member:', error);
      setError('Failed to save member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/members', { replace: true });
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
          {id ? 'Edit Member' : 'Create Member'}
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
          <MemberForm
            initialValues={member}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Paper>
      </Stack>
    </Container>
  );
} 