# Project Guidelines


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