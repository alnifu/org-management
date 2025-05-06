import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  UnstyledButton,
  Text,
  rem,
  useMantineColorScheme,
  Menu,
  Avatar,
  ActionIcon,
  Box,
  useMantineTheme,
} from '@mantine/core';
import {
  IconHome,
  IconUsers,
  IconUserCircle,
  IconArticle,
  IconLogout,
  IconUser,
  IconSettings,
  IconSun,
  IconMoonStars,
  IconBuilding,
  IconTable,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface NavLinkProps {
  icon: typeof IconHome;
  label: string;
  to: string;
  active?: boolean;
}

function NavLink({ icon: Icon, label, to, active }: NavLinkProps) {
  const { colorScheme } = useMantineColorScheme();

  return (
    <UnstyledButton
      component={Link}
      to={to}
      style={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: active
          ? theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6]
          : colorScheme === 'dark'
            ? theme.colors.dark[0]
            : theme.black,
        backgroundColor: active
          ? colorScheme === 'dark'
            ? theme.colors.dark[6]
            : theme.colors.gray[0]
          : 'transparent',
      })}
    >
      <Group>
        <Icon style={{ width: rem(20), height: rem(20) }} />
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const navItems = [
    { icon: IconHome, label: 'Organizations', to: '/organizations' },
    ...(user?.is_admin ? [
      { icon: IconTable, label: 'Org Table', to: '/organizations/table' },
      { icon: IconUsers, label: 'Officers', to: '/officers' },
      { icon: IconUserCircle, label: 'Members', to: '/members' },
    ] : []),
    { icon: IconArticle, label: 'Posts', to: '/posts' },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <MantineAppShell
      header={{ height: { base: 60, md: 70 } }}
      navbar={{
        width: { base: 300, sm: 250, md: 200 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="0" // Remove padding from AppShell itself
      styles={{
        main: {
          background: colorScheme === 'dark' ? theme.colors.dark[8] : theme.white, // Consistent background
        }
      }}
    >
      <MantineAppShell.Header>
        <Group h="100%" px={{ base: 'xs', sm: 'md', lg: 'xl' }} justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened(!opened)}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="lg" fw={700} c={theme.colors.green[6]}>Organization Management</Text>
          </Group>

          <Group>
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size="lg"
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group>
                    <Avatar
                      src={user?.profile_picture_url}
                      alt={`${user?.first_name} ${user?.last_name}`}
                      radius="xl"
                      color="green"
                    >
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {user?.first_name} {user?.last_name}
                      </Text>
                      <Text c="dimmed" size="xs">
                        {user?.is_admin ? 'Administrator' : 'Officer'}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
                  component={Link}
                  to="/profile"
                >
                  Profile
                </Menu.Item>
                {/*<Menu.Item
                  leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                  component={Link}
                  to="/settings"
                >
                  Settings
                </Menu.Item>*/}
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                  onClick={handleSignOut}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p={{ base: 'xs', sm: 'md' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            {...item}
            active={pathname === item.to}
          />
        ))}
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        {/* Box wrapper for content with consistent padding and background */}
        <Box
          bg={colorScheme === 'dark' ? theme.colors.dark[8] : theme.white}
          w="100%"
        >
          {/* Content container for max width and centering */}
          <Box
            mx="auto"
            w="100%"
            maw="1400px"
          >
            {children}
          </Box>
        </Box>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}