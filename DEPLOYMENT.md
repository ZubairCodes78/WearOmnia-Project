# WearOMNIA Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
Ensure the following environment variables are set in your production environment:

```env
# Database
DATABASE_URL="postgresql://postgres.sjtetkmtxtrnkstjfgwm:ZileHuma7866%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.sjtetkmtxtrnkstjfgwm:ZileHuma7866%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# WhatsApp Configuration
WHATSAPP_PROVIDER="MOCK"  # Change to "META" when ready for production
WHATSAPP_CLOUD_API_TOKEN="EAAG..."  # Add real token for production
WHATSAPP_CLOUD_PHONE_ID="1029384756"  # Add real phone ID for production

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://wearomnia.com"
NEXT_PUBLIC_CURRENCY="PKR"
```

### 2. Database Setup
Run the following commands to set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Create admin user
node scripts/create-admin.ts
```

### 3. Admin Credentials
Default admin credentials (CHANGE IMMEDIATELY AFTER FIRST LOGIN):
- **Email**: admin@wearomnia.com
- **Password**: WearOMNIA2026!

⚠️ **IMPORTANT**: Change this password after first login via Admin Settings > Security Settings

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)
1. Push code to GitHub repository
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 2: Node.js Server
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 Official Contact Details

These are the current official contact details configured in the system:

- **WhatsApp**: 03180633323 (international: 923180633323)
- **Instagram**: https://www.instagram.com/wearomnia_/
- **Facebook**: https://www.facebook.com/profile.php?id=61579169068040
- **TikTok**: https://www.tiktok.com/@wearomnia_
- **Email**: Wearomniaa@gmail.com
- **Address**: Not configured (no physical location)

## 🔒 Security Features Implemented

- ✅ Admin authentication with bcrypt password hashing
- ✅ HttpOnly, Secure, SameSite cookies for sessions
- ✅ Rate limiting for login attempts (5 attempts, 15-minute lockout)
- ✅ Route protection via middleware
- ✅ API authentication on all admin endpoints
- ✅ Password change functionality
- ✅ Audit logging for security events

## 🎨 Features

### Frontend
- Responsive design (mobile, tablet, desktop)
- Dynamic contact details (managed via Admin Panel)
- WhatsApp floating button with automatic number normalization
- Product catalog with categories
- Shopping cart with fly-to-cart animation
- Order tracking
- Size guide
- FAQ section
- Contact page with dynamic information

### Admin Panel
- Dashboard with order overview
- Product management (CRUD)
- Category management
- Order management with status updates
- Customer management
- Settings management (contact details, social media, shipping, etc.)
- Security settings (password change)
- Inventory management
- Shipping rules management
- Size guide management
- Coupon management
- Review management
- Automation logs
- Audit logs

### WhatsApp Integration
- Webhook endpoint for Meta WhatsApp Cloud API
- Automated order confirmation via WhatsApp
- Customer notifications
- Admin notifications
- Development mode (simulated) and production mode support

## 📊 Build Information

- **Framework**: Next.js 15.1.6
- **Runtime**: Node.js
- **Database**: PostgreSQL (Supabase)
- **Total Pages**: 48
- **Bundle Size**: ~105-169 kB per page
- **Middleware**: 32 kB

## 🐛 Troubleshooting

### Build Issues
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Regenerate Prisma client: `npx prisma generate`

### Database Issues
- Check DATABASE_URL is correct
- Run `npx prisma db push` to sync schema
- Check database connection in Supabase dashboard

### Admin Login Issues
- Check admin user exists in database
- Reset password using scripts/create-admin.ts
- Clear browser cookies
- Check rate limiting (wait 15 minutes if locked out)

## 📝 Post-Deployment Tasks

1. **Change Admin Password**: Login to Admin Panel and change password immediately
2. **Configure WhatsApp**: Add real Meta WhatsApp Cloud API credentials
3. **Test Order Flow**: Place a test order to verify the complete flow
4. **Set Up Payment Gateway**: Add payment integration if needed
5. **Configure Email**: Set up email service for order confirmations
6. **Test WhatsApp Integration**: Verify webhook is working (if using production mode)
7. **Update SSL**: Ensure HTTPS is enabled
8. **Set Up Monitoring**: Configure error tracking and monitoring

## 📞 Support

For deployment issues, contact:
- Email: Wearomniaa@gmail.com
- WhatsApp: 03180633323

---

**Deployment Date**: [Add date]
**Deployed By**: [Add name]
**Version**: 1.0.0
