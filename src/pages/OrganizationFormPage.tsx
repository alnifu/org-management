import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Alert,
  Center,
  Flex,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { OrganizationForm } from '../components/OrganizationForm';
import { supabase } from '../lib/supabase';

export function OrganizationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchOrganization = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (mounted) {
          setOrganization(data);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        if (mounted) {
          setError('Failed to load organization');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrganization();

    return () => {
      mounted = false;
    };
  }, [id, location.key]);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (id) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update(values)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new organization
        const { error } = await supabase
          .from('organizations')
          .insert([values]);

        if (error) throw error;
      }

      navigate('/organizations', { replace: true });
    } catch (error) {
      console.error('Error saving organization:', error);
      setError('Failed to save organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/organizations', { replace: true });
  };

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container py="xl" fluid>
      <Stack gap="lg">
        <Title order={1}>
          {id ? 'Edit Organization' : 'Create Organization'}
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
          <OrganizationForm
            initialValues={organization}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Paper>
      </Stack>
    </Container>

  );
} 