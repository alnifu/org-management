import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Title,
    Text,
    Paper,
    Stack,
    TextInput,
    PasswordInput,
    Button,
    Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProfileSetupFormValues {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
}

export function ProfileSetupPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileSetupFormValues>({
        initialValues: {
            first_name: '',
            last_name: '',
            username: '',
            email: '',
            password: '',
        },
        validate: {
            first_name: (value) => (!value ? 'First name is required' : null),
            last_name: (value) => (!value ? 'Last name is required' : null),
            username: (value) => (!value ? 'Username is required' : null),
            email: (value) => (!value ? 'Email is required' : /^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (!value ? 'Password is required' : value.length < 8 ? 'Password must be at least 8 characters' : null),
        },
    });

    const handleSubmit = async (values: ProfileSetupFormValues) => {
        try {
            setIsSubmitting(true);

            const { error } = await supabase
                .from('officers')
                .update({
                    first_name: values.first_name,
                    last_name: values.last_name,
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    is_setup_complete: true,
                })
                .eq('id', user?.id);

            if (error) throw error;

            notifications.show({
                title: 'Success',
                message: 'Profile setup completed successfully',
                color: 'green',
            });

            navigate('/organizations');
        } catch (error) {
            console.error('Error updating profile:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to update profile',
                color: 'red',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container size="sm" py="xl">
            <Stack gap="lg">
                <Title order={1}>Complete Your Profile</Title>
                <Text c="dimmed">
                    Please complete your profile information to continue using the system.
                </Text>

                <Paper withBorder p="xl" radius="md">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="First Name"
                                placeholder="Enter your first name"
                                required
                                {...form.getInputProps('first_name')}
                            />
                            <TextInput
                                label="Last Name"
                                placeholder="Enter your last name"
                                required
                                {...form.getInputProps('last_name')}
                            />
                            <TextInput
                                label="Username"
                                placeholder="Choose a username"
                                required
                                {...form.getInputProps('username')}
                            />
                            <TextInput
                                label="Email"
                                placeholder="Enter your email"
                                required
                                {...form.getInputProps('email')}
                            />
                            <PasswordInput
                                label="Password"
                                placeholder="Enter your password"
                                required
                                {...form.getInputProps('password')}
                            />
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                fullWidth
                                mt="md"
                            >
                                Complete Setup
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Stack>
        </Container>
    );
} 