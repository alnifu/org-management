# Organization Management System

A web-based organization management system built with React, TypeScript, Mantine UI, and Supabase.

## Features

- User authentication with username/password
- Role-based access control (Admin and Officers)
- Organization management
- Officer management
- Member management
- Post management with scheduled publishing
- Profile management with image upload

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Database Setup

Create the following tables in your Supabase database:

### Organizations
- id (uuid, primary key)
- name (text)
- description (text)
- logo_url (text, nullable)
- contact_email (text)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)

### Officers
- id (uuid, primary key)
- username (text)
- first_name (text)
- last_name (text)
- email (text)
- position_title (text)
- organization_id (uuid, foreign key)
- is_admin (boolean)
- status (text)
- bio (text, nullable)
- profile_picture_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### Members
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- profile_picture_url (text, nullable)
- bio (text, nullable)
- organization_ids (uuid[])
- created_at (timestamp)
- updated_at (timestamp)

### Posts
- id (uuid, primary key)
- organization_id (uuid, foreign key)
- title (text)
- content (text)
- image_urls (text[], nullable)
- posted_by (uuid, foreign key)
- is_members_only (boolean)
- scheduled_publish_date (timestamp)
- event_date (timestamp, nullable)
- location (text, nullable)
- likes (integer)
- created_at (timestamp)
- updated_at (timestamp)

## Usage

1. Login with your credentials
2. Navigate through the dashboard using the sidebar
3. Manage organizations, officers, members, and posts based on your role
4. Update your profile settings as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
