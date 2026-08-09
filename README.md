# WearOMNIA - Luxury Pakistani Fashion E-Commerce Platform

A modern, full-featured e-commerce platform for luxury Pakistani fashion, featuring unstitched lawn, velvet couture, and premium silk collections with nationwide Cash On Delivery.

## 🌟 Features

### Customer Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dynamic Contact Management**: All contact details managed via Admin Panel
- **WhatsApp Integration**: Floating WhatsApp button with automatic number normalization
- **Product Catalog**: Browse products by category with detailed views
- **Shopping Cart**: Smooth cart experience with fly-to-cart animation
- **Order Tracking**: Real-time order status tracking
- **Size Guide**: Interactive size guide for accurate measurements
- **FAQ Section**: Comprehensive FAQ for common questions
- **Contact Page**: Dynamic contact information and social media links

### Admin Panel
- **Dashboard**: Real-time order overview and statistics
- **Product Management**: Full CRUD operations for products
- **Category Management**: Organize products by categories
- **Order Management**: View, update, and manage orders
- **Customer Management**: View customer information and order history
- **Settings Management**: Configure all site settings including:
  - Contact details (WhatsApp, email, phone)
  - Social media URLs (Instagram, Facebook, TikTok, YouTube)
  - Shipping rates and rules
  - Announcement bar
  - Footer content
- **Security Settings**: Change admin password, view audit logs
- **Inventory Management**: Track stock levels
- **Shipping Rules**: City-specific shipping rates
- **Size Guides**: Manage size guide tables
- **Coupon Management**: Create and manage discount coupons
- **Review Management**: Approve and manage customer reviews
- **Automation Logs**: View WhatsApp automation logs
- **Audit Logs**: Track all admin actions

### Security Features
- ✅ Secure admin authentication with bcrypt password hashing
- ✅ HttpOnly, Secure, SameSite cookies for session security
- ✅ Rate limiting for login attempts (5 attempts, 15-minute lockout)
- ✅ Route protection via middleware
- ✅ API authentication on all admin endpoints
- ✅ Password change functionality
- ✅ Comprehensive audit logging

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Custom implementation with bcrypt
- **WhatsApp**: Meta WhatsApp Cloud API integration

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd wearomnia
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"
WHATSAPP_PROVIDER="MOCK"
WHATSAPP_CLOUD_API_TOKEN="your-token"
WHATSAPP_CLOUD_PHONE_ID="your-phone-id"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_CURRENCY="PKR"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Create admin user**
```bash
node scripts/create-admin.ts
```

6. **Run development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to view the site and `http://localhost:3000/admin/login` for the admin panel.

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📞 Official Contact Details

- **WhatsApp**: 03180633323
- **Instagram**: https://www.instagram.com/wearomnia_/
- **Facebook**: https://www.facebook.com/profile.php?id=61579169068040
- **TikTok**: https://www.tiktok.com/@wearomnia_
- **Email**: Wearomniaa@gmail.com

## 🔐 Default Admin Credentials

⚠️ **IMPORTANT**: Change these credentials immediately after first login!

- **Email**: admin@wearomnia.com
- **Password**: WearOMNIA2026!

## � Project Structure

```
wearomnia/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── contact/           # Contact page
│   ├── policies/          # Policy pages
│   └── ...
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── cart/             # Cart components
│   ├── home/             # Home page components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── notifications/    # Notification services
│   └── settings.ts       # Site settings
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database
- `node scripts/create-admin.ts` - Create admin user

## 📝 License

Copyright © 2026 WearOMNIA. All rights reserved.

## 🤝 Support

For support, contact:
- Email: Wearomniaa@gmail.com
- WhatsApp: 03180633323
