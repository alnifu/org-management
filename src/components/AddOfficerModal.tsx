import { useState, useEffect } from 'react';
import {
    Modal,
    Text,
    Stack,
    Group,
    Button,
    TextInput,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

interface AddOfficerModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddOfficerModal({ opened, onClose, onSuccess }: AddOfficerModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [credentials, setCredentials] = useState<{
        username: string;
        password: string;
    } | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (opened) {
            setCredentials(null);
            setCopied(false);
            setIsProcessing(false);
        }
    }, [opened]);

    const generateRandomString = (length: number) => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const handleAddOfficer = async () => {
        try {
            setIsProcessing(true);
            const username = generateRandomString(8);
            const password = generateRandomString(12);

            const { error } = await supabase
                .from('officers')
                .insert([{
                    username,
                    password,
                    is_setup_complete: false,
                    status: 'active',
                }]);

            if (error) throw error;

            setCredentials({ username, password });
        } catch (error) {
            console.error('Error adding officer:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDone = () => {
        onSuccess();
        onClose();
    };

    const copyToClipboard = () => {
        if (!credentials) return;
        const text = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Add New Officer"
            centered
        >
            <Stack>
                {!credentials ? (
                    <>
                        <Text>
                            This will create a new officer account with randomly generated credentials.
                            The officer will need to complete their profile setup on first login.
                        </Text>
                        <Group justify="flex-end">
                            <Button variant="light" onClick={onClose} disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddOfficer} loading={isProcessing}>
                                Generate Account
                            </Button>
                        </Group>
                    </>
                ) : (
                    <>
                        <Text>
                            Officer account created successfully! Please copy and share these credentials with the officer:
                        </Text>
                        <TextInput
                            label="Username"
                            value={credentials.username}
                            readOnly
                        />
                        <TextInput
                            label="Password"
                            value={credentials.password}
                            readOnly
                        />
                        <Group justify="flex-end">
                            <Button
                                variant="light"
                                leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                onClick={copyToClipboard}
                            >
                                {copied ? "Copied!" : "Copy Credentials"}
                            </Button>
                            <Button onClick={handleDone}>
                                Done
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        </Modal>
    );
} 