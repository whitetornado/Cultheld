# Order Management System - Complete Documentation

## System Overview

The Cultheld Order Management System is a comprehensive solution for managing e-commerce orders from placement to delivery. It includes admin tools for order processing, customer management, shipping notifications, and customer-facing order tracking.

---

## Features

### 1. **Order Flow Management**

Complete workflow for processing orders through multiple stages:

- **Order Statuses:**
  - `pending` - Order received, awaiting processing
  - `processing` - Order is being prepared
  - `shipped` - Order has been shipped to customer
  - `delivered` - Order delivered successfully
  - `cancelled` - Order cancelled

- **Status History Tracking:**
  - All status changes are logged with timestamps
  - Admin can add notes when changing status
  - Complete audit trail of order lifecycle

- **Automated Timestamps:**
  - `created_at` - Order placement time
  - `updated_at` - Last modification time
  - `shipped_at` - Shipping timestamp
  - `delivered_at` - Delivery timestamp
  - `cancelled_at` - Cancellation timestamp

### 2. **Track & Trace System**

- **Tracking Number Management:**
  - Admin can input tracking numbers
  - Support for multiple carriers (PostNL, DHL, DPD, UPS, FedEx)
  - Tracking URLs auto-generated per carrier

- **Customer Notifications:**
  - Automatic email when order is shipped
  - Professional email with tracking information
  - Direct links to carrier tracking pages
  - Branded emails with Cultheld logo

- **Customer Tracking Portal:**
  - Public page at `#/track-order`
  - Search by order number or email
  - View order status and tracking info
  - See order items and delivery address

### 3. **User Management & History**

- **Customer Summary View:**
  - List of all customers with statistics
  - Total orders per customer
  - Total amount spent
  - First and last order dates

- **Customer Order History:**
  - Complete order history per customer
  - Click to view individual orders
  - Quick access to customer details
  - Analytics on customer behavior

### 4. **Admin Dashboard**

- **Overview Statistics:**
  - Total orders
  - Total customers
  - Total revenue
  - Pending orders count

- **Quick Navigation:**
  - Orders Management
  - Customers Management
  - Products Management

### 5. **Orders Management Page**

- **Order List:**
  - Searchable by order number, customer, email, tracking number
  - Filter by status
  - Sort by date or amount
  - Color-coded status badges

- **Statistics Cards:**
  - Total orders
  - Pending orders
  - Processing orders
  - Shipped orders
  - Delivered orders

### 6. **Order Detail Page**

- **Order Information:**
  - Complete product list with images
  - Customer details
  - Shipping address
  - Payment information
  - Order totals with breakdown

- **Order Management:**
  - Update order status
  - Add tracking number and carrier
  - Add admin notes (internal)
  - Add status change notes (logged in history)
  - Send shipping notification to customer

- **Status History:**
  - View all status changes
  - See when changes occurred
  - Read notes for each change

---

## Database Schema

### Tables

#### `orders` (Enhanced)
```sql
- id (uuid, primary key)
- order_number (text, unique) - Auto-generated (ORD-YYYYMMDD-XXXX)
- customer_email (text)
- customer_name (text)
- customer_phone (text)
- shipping_address (jsonb)
- billing_address (jsonb)
- subtotal (numeric)
- shipping_cost (numeric)
- tax (numeric)
- total (numeric)
- status (text) - pending|processing|shipped|delivered|cancelled
- payment_status (text)
- payment_method (text)
- tracking_number (text) - Shipping tracking number
- carrier (text) - Shipping carrier name
- admin_notes (text) - Internal notes
- notes (text) - Customer-visible notes
- created_at (timestamptz)
- updated_at (timestamptz)
- shipped_at (timestamptz) - Auto-set when status = shipped
- delivered_at (timestamptz) - Auto-set when status = delivered
- cancelled_at (timestamptz) - Auto-set when status = cancelled
- cancelled_reason (text)
```

#### `order_status_history` (New)
```sql
- id (uuid, primary key)
- order_id (uuid, foreign key → orders)
- old_status (text)
- new_status (text)
- changed_by (uuid, foreign key → auth.users)
- notes (text)
- created_at (timestamptz)
```

#### `customers_summary` (View)
```sql
- customer_email
- customer_name
- total_orders (count)
- total_spent (sum)
- last_order_date
- first_order_date
```

### Functions

#### `update_order_status(order_id, new_status, notes)`
- Updates order status
- Auto-sets timestamps (shipped_at, delivered_at, cancelled_at)
- Logs change to order_status_history
- Records who made the change

#### `generate_order_number()`
- Generates unique order numbers
- Format: ORD-YYYYMMDD-XXXX
- Sequential numbering per day

#### `get_customer_orders(customer_email)`
- Returns all orders for a customer
- Includes order item counts
- Sorted by date (newest first)

---

## API Endpoints (Edge Functions)

### 1. `send-order-confirmation`
**Purpose:** Send order confirmation email to customer

**Input:**
```json
{
  "order_number": "ORD-20260113-0001",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "customer_phone": "+31612345678",
  "shipping_address": {
    "street": "Main Street 123",
    "city": "Amsterdam",
    "postal_code": "1012AB",
    "country": "Nederland"
  },
  "subtotal": 49.99,
  "shipping_cost": 6.95,
  "tax": 10.50,
  "total": 67.44,
  "items": [
    {
      "legend_name": "Dennis Bergkamp",
      "product_type_name": "T-shirt",
      "color_name": "Black",
      "size": "L",
      "quantity": 1,
      "unit_price": 49.99,
      "total_price": 49.99
    }
  ]
}
```

**Features:**
- Professional branded email
- Order summary with itemized list
- Price breakdown with BTW
- Shipping address
- Cultheld logo included

### 2. `send-admin-notification`
**Purpose:** Notify admin of new order

**Input:** Same as order confirmation

**Features:**
- Alert-style email design
- Highlighted order number
- Customer contact information
- Complete order details
- Action reminder for admin

### 3. `send-shipping-notification`
**Purpose:** Notify customer when order is shipped

**Input:**
```json
{
  "order_number": "ORD-20260113-0001",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "tracking_number": "3SABCD123456789",
  "carrier": "PostNL",
  "tracking_url": "https://..." (optional)
}
```

**Features:**
- Success-themed email
- Tracking information prominently displayed
- Direct link to carrier tracking
- Expected delivery timeframe
- Branded with Cultheld logo

**Supported Carriers:**
- PostNL
- DHL
- DPD
- UPS
- FedEx

---

## User Interfaces

### Admin Routes

#### `/admin/dashboard`
**Admin Dashboard**
- Statistics overview
- Quick navigation to management pages
- Alerts for pending orders

#### `/admin/orders`
**Orders Management**
- Complete order list
- Search and filter functionality
- Status statistics
- Click order to view details

#### `/admin/orders/:orderId`
**Order Detail**
- Complete order information
- Status management
- Tracking number input
- Send shipping notifications
- Status history view

#### `/admin/customers`
**Customers Management**
- Customer list with statistics
- Search customers
- Sort by orders/spending/recency
- View customer order history
- Click order to view details

#### `/admin`
**Products Management**
- Manage seasons, clubs, legends
- Configure products and mockups
- (Existing functionality)

### Customer Routes

#### `/track-order`
**Order Tracking**
- Public page (no login required)
- Search by order number or email
- View order status
- See tracking information
- View order items
- Contact information

---

## Email Templates

All email templates are professionally designed with:
- Cultheld branding and logo
- Responsive HTML design
- Mobile-friendly layout
- Clear call-to-action buttons
- Professional typography
- Color-coded sections

### Email Configuration

To enable emails, configure in Supabase:
1. Sign up for free Resend.com account
2. Add `RESEND_API_KEY` environment variable
3. Optionally set `ADMIN_EMAIL` for admin notifications

Emails work in demo mode without configuration (logs to console).

---

## Security & Permissions

### Row Level Security (RLS)

All tables have RLS enabled with admin-only policies:

**Orders Table:**
- Admins can SELECT, INSERT, UPDATE
- Regular users cannot access

**Order Status History:**
- Admins can SELECT, INSERT
- Tracks who made changes

**Customers Summary View:**
- Admins can SELECT
- Aggregated from orders table

### Admin Authentication

- JWT-based authentication via Supabase Auth
- Role check: `auth.jwt()->>'role' = 'admin'`
- Admin users defined in auth.users with metadata

---

## Workflow Examples

### Order Processing Workflow

1. **Customer places order**
   - Order created with status: `pending`
   - Confirmation email sent to customer
   - Admin notification sent

2. **Admin processes order**
   - Login to admin dashboard
   - Navigate to Orders Management
   - Click on order to view details
   - Change status to `processing`
   - Add admin notes if needed

3. **Order is shipped**
   - Enter tracking number
   - Select carrier
   - Update status to `shipped`
   - Click "Send Shipping Notification"
   - Customer receives tracking email

4. **Order delivered**
   - Update status to `delivered`
   - System auto-sets delivered_at timestamp

### Customer Tracking Workflow

1. **Customer wants to track order**
   - Visit `/track-order` page
   - Enter order number or email
   - Click search

2. **View order information**
   - See current status
   - View tracking number if shipped
   - Click link to carrier tracking
   - See order items and address
   - Contact info for support

---

## Analytics & Reporting

### Dashboard Statistics
- Total orders count
- Total customers count
- Total revenue
- Pending orders (requires action)

### Customer Insights
- Customer lifetime value
- Order frequency
- Average order value
- Customer since date

### Order Metrics
- Orders by status
- Revenue trends
- Processing times
- Shipping performance

---

## Best Practices

### Order Management
1. Process pending orders daily
2. Update tracking numbers promptly
3. Send shipping notifications immediately after adding tracking
4. Add notes for any special circumstances
5. Monitor status history for audit trail

### Customer Service
1. Respond to order inquiries within 24 hours
2. Proactively update customers on delays
3. Use admin notes for internal communication
4. Keep accurate tracking information

### System Maintenance
1. Monitor email delivery success
2. Check for stuck orders in processing
3. Review customer feedback
4. Update carrier URLs if changed

---

## Troubleshooting

### Emails Not Sending
- Check RESEND_API_KEY is configured
- Verify email addresses are valid
- Check edge function logs in Supabase
- Ensure functions are deployed

### Order Not Found in Tracking
- Verify customer is searching with correct order number or email
- Check order exists in database
- Ensure RLS policies allow public read for tracking

### Status Not Updating
- Verify admin is logged in
- Check admin role in JWT
- Ensure RLS policies allow admin updates
- Check browser console for errors

---

## Future Enhancements

Potential improvements:
1. Bulk order operations
2. Export orders to CSV
3. Print packing slips
4. Shipping label generation
5. Return/refund management
6. Customer portal with login
7. Advanced analytics dashboard
8. Automated status updates from carriers
9. SMS notifications
10. Multi-language support

---

## Technical Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Edge Functions:** Deno
- **Email Service:** Resend.com
- **Storage:** Supabase Storage

---

## Support & Contact

For questions or issues:
- Email: info@cultheld.com
- Admin Dashboard: Login to manage orders
- Customer Tracking: Visit /track-order page

---

*Last Updated: January 2026*
*Version: 1.0.0*
