# TRONX Restaurant

TRONX is a digital restaurant menu with a public customer menu and an authenticated admin console for managing restaurants, categories, dishes, add-ons, availability, and media.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- MongoDB with Mongoose
- Cloudinary for image and video assets
- Zod and React Hook Form for validation and admin forms

## Local Setup

```bash
npm install
```

Copy `.env.example` to `.env.local`, provide local values, ensure MongoDB and Cloudinary are available, then seed the default restaurant data:

```bash
npm run seed:mongodb
```

The seed is idempotent and inserts missing demo records without overwriting existing records.

## Environment Variables

Required server-side variables:

```dotenv
MONGODB_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AUTH_SECRET=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
RESTAURANT_ADMIN_EMAIL=
RESTAURANT_ADMIN_PASSWORD=
RESTAURANT_ADMIN_ID=moai-kitchen
```

Never expose these values through `NEXT_PUBLIC_*` variables or client components. `.env.local` is ignored by Git.

## Running Locally

```bash
npm run dev
```

Public menu:

- `http://localhost:3000/`
- `http://localhost:3000/menu/moai-kitchen`
- `http://localhost:3000/menu/native-south`

Admin:

- `http://localhost:3000/admin/login`
- `http://localhost:3000/super-admin/login`
- `http://localhost:3000/admin/moai-kitchen`

Restaurant admin credentials come from `RESTAURANT_ADMIN_EMAIL` and `RESTAURANT_ADMIN_PASSWORD`. Super admin credentials come from `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`. `AUTH_SECRET` signs the httpOnly admin session cookie.

## Production Build

```bash
npm run build
npm run start
```

Configure MongoDB network access, Cloudinary credentials, HTTPS, and deployment secrets in the hosting platform rather than committing them.

## Architecture

Admin and customer data flows through the existing repository/service layers into MongoDB. Customer menus use the public restaurant menu API, while media uploads and deletion use server-side Cloudinary operations followed by MongoDB persistence.
