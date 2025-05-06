import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Avatar,
  Text,
  Menu,
  rem,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHome,
  IconBuilding,
  IconUsers,
  IconUser,
  IconLogout,
  IconChevronRight,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { icon: IconHome, label: 'Home', path: '/' },
    { icon: IconBuilding, label: 'Organizations', path: '/organizations' },
    ...(user?.is_admin ? [{ icon: IconUsers, label: 'Officers', path: '/officers' }] : []),
  ];

  return (
    <AppShell
      header={{ height: { base: 50, md: 70 } }}
      navbar={{
        width: { sm: 200, lg: 300 },
        breakpoint: 'sm',
        collapsed: { desktop: false, mobile: !opened }
      }}
      padding="md"
      styles={{
        main: {
          background: 'var(--mantine-color-gray-0)',
          minHeight: '100vh'
        }
      }}
    >
      <AppShell.Header p="md">
        <Group justify="space-between" h="100%">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group ml="auto">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group>
                    <Avatar
                      src={user?.profile_picture_url}
                      radius="xl"
                      size="sm"
                    >
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        {user?.first_name} {user?.last_name}
                      </Text>
                      <Text c="dimmed" size="xs">
                        {user?.position_title}
                      </Text>
                    </div>
                    <IconChevronRight size={rem(16)} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUser size={rem(14)} />}
                  component={Link}
                  to="/profile"
                >
                  Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={rem(14)} />}
                  onClick={handleLogout}
                  color="red"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      
      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <UnstyledButton
            key={item.path}
            component={Link}
            to={item.path}
            style={(theme) => ({
              display: 'block',
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              marginBottom: '0.5rem',
              backgroundColor: location.pathname === item.path ? 'var(--mantine-color-gray-1)' : 'transparent',
              '&:hover': {
                backgroundColor: theme.colors.dark[6],
              },
            })}
          >
            <Group>
              <item.icon size={rem(20)} />
              <Text size="sm">{item.label}</Text>
            </Group>
          </UnstyledButton>
        ))}
      </AppShell.Navbar>
      
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}