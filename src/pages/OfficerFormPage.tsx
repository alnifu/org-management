import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { OfficerForm } from '../components/OfficerForm';
import { supabase } from '../lib/supabase';

export function OfficerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [officer, setOfficer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOfficer();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchOfficer = async () => {
    try {
      const { data, error } = await supabase
        .from('officers')
        .select('*, organizations(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data to match the form structure
      const transformedData = {
        ...data,
        organization_id: data.organizations?.id,
      };
      delete transformedData.organizations;

      setOfficer(transformedData);
    } catch (error) {
      console.error('Error fetching officer:', error);
      setError('Failed to load officer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (id) {
        // Update existing officer
        const { error } = await supabase
          .from('officers')
          .update(values)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new officer
        const { error } = await supabase
          .from('officers')
          .insert([values]);

        if (error) throw error;
      }

      navigate('/officers');
    } catch (error) {
      console.error('Error saving officer:', error);
      setError('Failed to save officer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/officers');
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
          {id ? 'Edit Officer' : 'Create Officer'}
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
          <OfficerForm
            initialValues={officer}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Paper>
      </Stack>
    </Container>
  );
} 