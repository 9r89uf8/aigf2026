# Project Guidelines

we are going to implement a chat system section by section. the 3 sections are:
Section 1 — Core Text Chat (E2E)
Section 2 — Media in Chat (Images & Video)
Section 3 — Audio (Voice Notes + AI Voice Replies)

you can find the plan for section 1 at [chat_section_1_plan.md](chat_section_1_plan.md) please follow it.

## Coding Standards
- Never use TypeScript anywhere - JavaScript only
- Use Tailwind CSS for all styling
- Follow existing patterns and conventions in the codebase

## Project Overview
This is a Next.js application for an AI girlfriend chat platform with:
- User authentication and profiles
- Secure S3/CloudFront media handling
- Admin panel for managing AI girlfriend profiles and content
- Built on Convex backend with real-time features

## Documentation References

### Authentication & User Management
**[auth.md](auth.md)** - Use when working with authentication, user sessions, or role-based access control

**[account_auth_implementation.md](account_auth_implementation.md)** - Use when adding features to user profiles or account management

### Media & File Handling
**[s3-cloudfront-implementation.md](s3-cloudfront-implementation.md)** - Use when implementing file uploads, image viewing, or any S3/CloudFront operations

### Admin Features
**[admin-implementation.md](admin-implementation.md)** - Use when working on admin panel features, managing girls/profiles, or media content management

### Payments
**[PAYMENTS_SYSTEM.md](PAYMENTS_SYSTEM.md)** - Complete payment system documentation: architecture, API reference, developer guide, and troubleshooting


## Environment Variables

The following environment variables are required for the application:

### Required for Development
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SITE_URL=http://localhost:3000

# S3/CloudFront (for media handling)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET=your_s3_bucket_name
CLOUDFRONT_DISTRIBUTION_ID=your_cloudfront_distribution_id
CLOUDFRONT_PRIVATE_KEY=your_cloudfront_private_key
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
```

### Required for Production
```env
# Same as development but with production values:
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
SITE_URL=https://yourdomain.com
```