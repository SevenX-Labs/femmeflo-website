# Femmeflo application guide

## Overview

Femmeflo is a Next.js App Router application with a public brand website and authenticated Super Admin, Manager, and Seller workspaces. The management frontend calls the Express API in `femmeflo-yfa-inventory-server`, which provides JWT authentication, server-enforced role authorization, and Prisma-backed business records. The separate Next.js contact and chat API routes are also available.

## Technology

- Next.js 16.2.11 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Lucide React icons
- Framer Motion, GSAP, and Lenis for public-site interactions and scrolling
- Nodemailer for optional SMTP contact email
- Mistral chat completions API for optional website support chat

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If that port is already occupied, Next.js may select another port. Use the URL printed in the terminal.

Available scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve a production build |
| `npm run lint` | Run ESLint |

## Routes

### Public website

| Route | Screen |
| --- | --- |
| `/` | Femmeflo landing page and product information |
| `/contact` | Contact and enquiry form |

### Seller workspace

| Route | Screen |
| --- | --- |
| `/seller/login` | Seller sign-in preview |
| `/seller/forgot-password` | Password recovery preview |
| `/seller` | Seller overview/dashboard |
| `/seller/customers` | Seller customer directory |
| `/seller/customers/new` | Add customer |
| `/seller/sales` | Seller sales history |
| `/seller/sales/new` | Record a sale |
| `/seller/inventory` | Seller stock position and movements |
| `/seller/incentive` | Seller incentive summary and history |
| `/seller/profile` | Seller profile and contact details |

### Manager workspace

| Route | Screen |
| --- | --- |
| `/manager/login` | Manager sign-in preview |
| `/manager/forgot-password` | Password recovery route reusing the recovery preview |
| `/manager` | Manager overview/dashboard |
| `/manager/sellers` | Assigned seller directory |
| `/manager/sellers/new` | Add seller |
| `/manager/customers` | Assigned customer directory |
| `/manager/customers/new` | Add customer |
| `/manager/sales` | Territory sales directory |
| `/manager/inventory` | Territory stock position |

### Super Admin workspace

| Route | Screen |
| --- | --- |
| `/admin/login` | Admin sign-in preview |
| `/admin/forgot-password` | Admin password recovery preview |
| `/admin` | Business overview/dashboard |
| `/admin/managers` | Manager directory |
| `/admin/managers/new` | Add manager |
| `/admin/sellers` | Seller directory |
| `/admin/sellers/new` | Add seller |
| `/admin/customers` | Customer directory |
| `/admin/customers/new` | Add customer |
| `/admin/inventory` | Stock position across the distribution chain |
| `/admin/inventory/transfers` | Create stock transfer and review sample transfer history |
| `/admin/categories` | Manage customer category options in local screen state |
| `/admin/sales` | All sales directory |
| `/admin/approvals` | Review low-price sale requests |
| `/admin/incentives` | Seller incentive summary |
| `/admin/invoices` | Invoice directory |
| `/admin/reports` | Business reporting overview |
| `/admin/permissions` | Role permission preview |
| `/admin/notifications` | Admin notifications preview |
| `/admin/manager/seller` | Additional seller management screen |

## Navigation and shared management UI

The role menus are defined in `src/components/management/navigation.ts`. Navigation data uses serializable string icon keys. `DashboardShell.tsx` maps those keys to Lucide icons inside the Client Component; this keeps icon component objects from crossing the Server-to-Client boundary.

Shared UI components:

- `DashboardShell.tsx` — role workspace frame, sidebar navigation, page headings, metric cards, and section cards.
- `ResourceListScreen.tsx` — shared searchable directory with status filtering, extra location/category filters, CSV export for export actions, and a record details dialog.
- `OnboardingFormScreen.tsx` — shared seller/customer onboarding form. Customer mode includes image selection and browser geolocation capture.
- `navigation.ts` — serializable navigation configuration for each role.

## Current interactive behavior

- Login forms authenticate through `POST /api/v1/auth/login`, validate the returned role, and store the session token for authenticated API requests.
- Password recovery displays a confirmation preview; it does not send a reset message.
- Customer onboarding can request browser geolocation and submits customer records to the role-specific customer endpoint. The current image picker is local to the browser; image upload is not implemented by the backend.
- Seller sale entry calculates the total, submits the sale to the seller sales API, and the backend enforces stock limits and minimum-price approval rules.
- The Admin approval screen reads pending sale requests and submits approve/reject decisions to the backend.
- Category management lists categories from the API and creates them in the backend.
- Stock transfer entry submits inventory transfers to the backend and displays persisted transaction history.
- Directory pages load records through role-specific API endpoints; search, filtering, CSV download, and detail dialogs run in the browser.

Management records are stored by the backend. Temporary form and filter state remains in the browser.

## API routes

### `POST /api/contact`

Accepts a JSON body with required `name`, `email`, and `message` fields; `phone` and `queryType` are optional. When SMTP is configured, the handler sends an email. Without SMTP credentials, it logs the enquiry in development mode and returns a success response.

Environment variables:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port; defaults to `587` |
| `SMTP_USER` | SMTP account username and sender address |
| `SMTP_PASS` | SMTP account password |
| `CONTACT_RECEIVER_EMAIL` | Enquiry destination; defaults to `sales@femmeflo.in` |

### `POST /api/chat`

Accepts a JSON body with a `messages` array. When `MISTRAL_API_KEY` is set, the route calls Mistral's chat completions API. Without the key, or if the upstream request fails, it returns a static support response.

Environment variable:

| Variable | Purpose |
| --- | --- |
| `MISTRAL_API_KEY` | Server-side Mistral API key |

Keep these values in local environment configuration and do not commit secrets.

## Project layout

```text
src/
  app/
    admin/                 Admin workspace routes
    manager/               Manager workspace routes
    seller/                Seller workspace routes
    api/contact/           Contact enquiry endpoint
    api/chat/              Website support chat endpoint
    contact/               Public contact page
    page.tsx               Public landing page
    layout.tsx             Root layout, fonts, metadata, smooth scrolling
    globals.css            Global styles and Tailwind imports
  components/
    management/            Shared management screens and shell
    ...                    Public website sections and UI
public/                    Logos, product imagery, videos, and other static assets
```

## Backend setup

The Express API source lives in `femmeflo-yfa-inventory-server`. Configure its database and authentication environment, then start that server alongside Next.js. Set `NEXT_PUBLIC_API_URL` in the frontend environment to the backend API base URL (for local development, `http://localhost:5000/api/v1`). The backend route definitions are in `femmeflo-yfa-inventory-server/src/routes`; the frontend service wrappers are in `src/lib/api`.
