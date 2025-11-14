# Indian Groom Elegance - Premium Sherwani Collection

A modern e-commerce platform for premium Indian ethnic wear, built with React, TypeScript, and Supabase.

## 🚀 Features

### User Features
- **Product Browsing**: Browse through premium sherwanis, jodhpuri suits, and indo-western wear
- **Dynamic Image Management**: Real product images with multiple views per product
- **Shopping Cart**: Add items to cart with quantity management
- **Order Management**: Track order status and request cancellations
- **Wishlist**: Save favorite products for later
- **User Authentication**: Phone number-based authentication
- **Responsive Design**: Mobile-first design with modern UI

### Admin Features
- **Product Management**: Add, edit, and delete products with image uploads
- **Order Management**: Process orders, update statuses, and handle cancellations
- **Analytics Dashboard**: Real-time sales and order analytics
- **Inventory Management**: Track product stock and availability

### Technical Features
- **Real-time Data**: Live updates using React Query
- **Image Optimization**: Dynamic image loading with fallbacks
- **Error Handling**: Comprehensive error management and recovery
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Built with shadcn/ui and Tailwind CSS

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd indian-groom-elegance-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8086` (or the port shown in terminal)

## 🗄️ Database Setup

### Required Tables
The application uses the following Supabase tables:

- `products` - Product information and details
- `categories` - Product categories
- `orders` - Customer orders
- `order_items` - Individual items in orders
- `customer_profiles` - User profile information
- `cart_items` - Shopping cart items
- `wishlist_items` - User wishlist
- `product_images` - Product image URLs (Supabase storage)
- `order_status_history` - Order status change tracking

### Database Migration
To set up the database schema, run the SQL commands in `database_migration.sql` in your Supabase SQL editor.

## 🖼️ Image Management

### Image Storage
- **Local Images**: Stored in `public/images/products/`
- **Supabase Storage**: Uploaded via admin panel to `product-images` bucket
- **Priority System**: Supabase images take precedence over local images

### Image Naming Convention
- **Single Image**: `product-name.jpg`
- **Multiple Images**: `product-name_1.jpg`, `product-name_2.jpg`, etc.
- **Fallback**: `placeholder.svg` for missing images

### Image Mapping
The system automatically maps product names to image files:
```typescript
// Example: Product "Royal Blue Sherwani" maps to:
// - /images/products/Royal Blue Sherwani.jpg
// - /images/products/Royal Blue Sherwani_1.jpg
// - /images/products/Royal Blue Sherwani_2.jpg
```

## 🔄 Order Management

### Order Status Flow
1. **Pending** → Order placed, awaiting confirmation
2. **Processing** → Order confirmed, being prepared
3. **Shipped** → Order dispatched to customer
4. **Delivered** → Order successfully delivered
5. **Cancelled** → Order cancelled (with refund logic)

### Cancellation System
- **User-Initiated**: Customers can request order cancellation
- **Admin Review**: Admins review and approve/reject requests
- **Refund Policy**: 90% refund, 10% cancellation fee
- **Status Tracking**: Full audit trail of status changes

## 🛡️ Error Handling

### Comprehensive Error Management
The application implements robust error handling across all components:

#### Error Types Handled
- **Database Errors**: Connection issues, constraint violations
- **Network Errors**: API failures, timeout issues
- **Validation Errors**: Form validation, data integrity
- **Image Errors**: Upload failures, missing images
- **Order Errors**: Cancellation conflicts, status issues

#### Error Recovery Strategies
- **Retry Logic**: Exponential backoff for failed requests
- **Fallback Mechanisms**: Placeholder content for missing data
- **User Feedback**: Clear error messages with actionable steps
- **Graceful Degradation**: App continues working despite non-critical errors

#### Error Display
- **Loading States**: Show progress during operations
- **Error Boundaries**: Prevent app crashes from component errors
- **Toast Notifications**: User-friendly error messages
- **Retry Options**: Allow users to retry failed operations

### Error Handling Implementation
```typescript
// Example: Error handling in queries
const { data, error } = useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) {
        const appError = handleSupabaseError(error, 'Fetching orders');
        throw appError;
      }
      return data;
    } catch (error) {
      logError(error, 'Orders query');
      throw error;
    }
  },
  retry: (failureCount, error) => {
    if ((error as any)?.statusCode === 401) return false;
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

## 📱 Admin Panel

### Access
Navigate to `/admin` and use admin credentials to access the management panel.

### Features
- **Product Management**: CRUD operations for products
- **Order Processing**: Update order statuses and handle cancellations
- **Analytics**: Real-time sales and order statistics
- **Image Upload**: Bulk image upload to Supabase storage

## 🎨 UI Components

### Design System
Built with shadcn/ui components and custom Tailwind CSS classes:

- **Color Scheme**: Royal navy, gold accents, ivory backgrounds
- **Typography**: Serif fonts for headings, sans-serif for body text
- **Spacing**: Consistent 4px grid system
- **Shadows**: Custom shadow classes for depth

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet**: Adaptive layouts for medium screens
- **Desktop**: Full-featured desktop experience

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── utils/              # Utility functions
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── lib/                # Library configurations
```

### Key Hooks
- `useAuth` - Authentication state management
- `useCart` - Shopping cart functionality
- `useProducts` - Product data fetching
- `useOrders` - Order management
- `useWishlist` - Wishlist functionality

### State Management
- **React Query**: Server state management
- **React Context**: Global app state
- **Local State**: Component-specific state

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure all required environment variables are set in production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Configuration
1. Set up Row Level Security (RLS) policies
2. Configure storage buckets and policies
3. Set up authentication providers
4. Configure email templates

## 📊 Analytics

### Admin Dashboard
- **Revenue Tracking**: Real-time sales data
- **Order Analytics**: Order status distribution
- **Product Performance**: Best-selling products
- **Customer Insights**: User behavior patterns

### Metrics Tracked
- Total revenue and growth
- Order completion rates
- Product popularity
- Customer retention

## 🔒 Security

### Authentication
- Phone number-based authentication
- OTP verification
- Session management
- Role-based access control

### Data Protection
- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure API endpoints
- HTTPS enforcement

## 🧪 Testing

### Error Scenarios
- Network failures
- Database connection issues
- Invalid user inputs
- Missing data scenarios
- Authentication failures

### Testing Checklist
- [ ] Product browsing with various filters
- [ ] Cart operations (add, remove, update)
- [ ] Order placement and tracking
- [ ] Admin panel functionality
- [ ] Error handling and recovery
- [ ] Responsive design across devices

## 📝 API Documentation

### Supabase Tables
Detailed documentation for all database tables and their relationships.

### Custom Hooks
Documentation for all custom React hooks and their usage.

### Component API
Props and usage examples for all custom components.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the error handling guide in `ERROR_HANDLING_GUIDE.md`
- Review the database migration file
- Check the Supabase dashboard for configuration issues

## 🔄 Changelog

### Version 1.0.0
- Initial release with core e-commerce functionality
- Comprehensive error handling system
- Admin panel with analytics
- Mobile-responsive design
- Real-time order management
