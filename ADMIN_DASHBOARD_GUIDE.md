# Admin Dashboard - Setup & Features

## 🎯 Overview
A fully functional admin dashboard for 724 Restaurant And Bar built with shadcn/ui, React 19, and Recharts.

## 📍 Access Routes
- **Dashboard Home**: `/admin`
- **Menu Management**: `/admin/menu`
- **Settings & Configuration**: `/admin/settings`

## ✨ Features Implemented

### 1. Dashboard (`/admin`)
- **KPI Cards** showing:
  - Total Revenue (₦128,000)
  - Total Orders (2,240)
  - Menu Items Count (45)
  - Average Order Value (₦5,714)
  
- **Interactive Charts** (tabbed view):
  - **Revenue Trend**: Line chart showing monthly revenue and orders
  - **Menu Items Performance**: Bar chart showing sales and revenue by item
  - **Sales Distribution**: Pie chart showing sales proportion by menu item
  
- **Recent Orders**: Table/list showing latest orders with status

### 2. Menu Management (`/admin/menu`)
- **Statistics Cards**: Total items, total sold, total revenue
- **Search Functionality**: Filter menu items by name or category
- **Menu Items Table** (Desktop) / **Cards** (Mobile):
  - Item name, description, category
  - Price, stock level (color-coded for low stock)
  - Units sold, revenue generated

- **Full CRUD Operations**:
  - ✅ **Create**: Add new menu items with dialog form
  - ✅ **Read**: View all items with search and filtering
  - ✅ **Update**: Edit existing menu items
  - ✅ **Delete**: Remove items with confirmation dialog

- **Form Fields**:
  - Item name
  - Description
  - Price (₦)
  - Category (Meat, Seafood, Soup, Sides, Drinks)
  - Stock quantity
  - Image URL

### 3. Settings (`/admin/settings`)

**Account Tab**:
- Business name
- Email address
- Phone number
- Password change functionality

**Site Settings Tab**:
- **Site Information**:
  - Site title & description
  - Street address, city, state, ZIP code
  
- **Operating Hours & Delivery**:
  - Opening/Closing times
  - Delivery fee configuration
  - Minimum order value
  
- **Maintenance Mode**:
  - Toggle maintenance mode on/off
  - Custom maintenance message for customers
  
- **Danger Zone**:
  - Clear all data (with confirmation)

## 🎨 Design Features

### Responsive Design
- ✅ **Mobile-first approach** with breakpoints for tablets and desktops
- ✅ **Mobile Sidebar**: Hamburger menu on small screens
- ✅ **Desktop Sidebar**: Fixed navigation sidebar on md+ screens
- ✅ **Cards View**: Mobile-optimized card layout for menu items
- ✅ **Table View**: Full-featured data table on desktop

### Navigation
- **Sidebar Navigation**: 
  - Home (Dashboard)
  - Menu Items
  - Settings
  - Logout button
  
- **Active Route Highlighting**: Current page highlighted with gradient accent

### Styling
- Dark gradient sidebar (slate-900 to slate-800)
- Orange-to-red gradient for primary actions
- Professional color scheme with proper contrast
- Smooth transitions and hover effects
- Icons from lucide-react

## 🚀 Getting Started

### Access the Admin Panel
```
http://localhost:9002/admin
```

### Dev Server
The dev server is already running on port 9002:
```bash
npm run dev
```

## 🔧 Technical Stack
- **Framework**: Next.js 15.5.9 with App Router
- **UI Components**: shadcn/ui (built on Radix UI)
- **Charts**: Recharts 2.15.1
- **Forms**: React Hook Form 7.54.2 + Zod validation
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React useState (client-side)
- **Icons**: Lucide React 0.475.0

## 📊 Mock Data
The dashboard includes mock data for demonstration:
- 6 months of revenue/order trends
- 5 top-selling menu items with metrics
- Sales distribution pie chart
- Recent order history

## 🔐 Future Enhancements
To connect with real data:
1. Replace mock data with API calls
2. Implement authentication for the /admin route
3. Add database integration (Firebase/PostgreSQL)
4. Implement real-time order updates
5. Add image upload for menu items
6. Add analytics and export features
7. Implement user roles and permissions

## 📱 Mobile Responsiveness
- ✅ Hamburger menu on mobile (< 768px)
- ✅ Stacked layout for cards and tables
- ✅ Touch-friendly buttons and spacing
- ✅ Optimized chart heights for mobile viewing
- ✅ Responsive typography and padding

---

**All pages are fully functional and ready to use!**
