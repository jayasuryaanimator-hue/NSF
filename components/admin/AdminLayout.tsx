import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  RotateCcw, 
  Users, 
  Receipt, 
  FileText, 
  BarChart3, 
  FileEdit,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Home,
  Star,
  Newspaper,
  MessageSquare,
  Settings,
  CreditCard,
  Image,
  Boxes,
  ArrowLeftRight,
  AlertTriangle,
  ImageIcon,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { 
    title: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/admin' 
  },
  { 
    title: 'Branches', 
    icon: Store, 
    path: '/admin/branches' 
  },
  { 
    title: 'Stock', 
    icon: Boxes, 
    path: '/admin/stock',
    children: [
      { title: 'Stock Overview', path: '/admin/stock' },
      { title: 'Stock Transfers', path: '/admin/stock-transfers' },
      { title: 'Damaged Stock', path: '/admin/damaged-stock' },
    ]
  },
  { 
    title: 'Products', 
    icon: Package, 
    path: '/admin/products',
    children: [
      { title: 'All Products', path: '/admin/products' },
      { title: 'Add Product', path: '/admin/products/new' },
    ]
  },
  { 
    title: 'Categories', 
    icon: FolderOpen, 
    path: '/admin/categories' 
  },
  { 
    title: 'Orders', 
    icon: ShoppingCart, 
    path: '/admin/orders' 
  },
  {
    title: 'Payments',
    icon: CreditCard,
    path: '/admin/payments'
  },
  { 
    title: 'Returns', 
    icon: RotateCcw, 
    path: '/admin/returns' 
  },
  { 
    title: 'Customers', 
    icon: Users, 
    path: '/admin/customers',
    children: [
      { title: 'All Customers', path: '/admin/customers' },
      { title: 'User Management', path: '/admin/users' },
    ]
  },
  { 
    title: 'Billing', 
    icon: Receipt, 
    path: '/admin/billing',
    children: [
      { title: 'All Bills', path: '/admin/billing' },
      { title: 'New Bill', path: '/admin/billing/new' },
    ]
  },
  { 
    title: 'Quotations', 
    icon: FileText, 
    path: '/admin/quotations',
    children: [
      { title: 'All Quotations', path: '/admin/quotations' },
      { title: 'New Quotation', path: '/admin/quotations/new' },
      { title: 'Custom Orders', path: '/admin/custom-orders' },
    ]
  },
  { 
    title: 'Reports', 
    icon: BarChart3, 
    path: '/admin/reports' 
  },
  { 
    title: 'Reviews', 
    icon: Star, 
    path: '/admin/reviews' 
  },
  { 
    title: 'Blog', 
    icon: Newspaper, 
    path: '/admin/blog',
    children: [
      { title: 'All Posts', path: '/admin/blog' },
      { title: 'New Post', path: '/admin/blog/new' },
    ]
  },
  { 
    title: 'Messages', 
    icon: MessageSquare, 
    path: '/admin/messages' 
  },
  { 
    title: 'Page Content', 
    icon: FileEdit, 
    path: '/admin/pages',
    children: [
      { title: 'Page Sections', path: '/admin/pages' },
      { title: 'Banner Management', path: '/admin/banners' },
      { title: 'Gallery', path: '/admin/gallery' },
    ]
  },
  { 
    title: 'Settings', 
    icon: Settings, 
    path: '/admin/settings' 
  },
];

export default function AdminLayout() {
  const { user, loading, isAdmin, isBranchManager, userBranchId, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branchName, setBranchName] = useState<string | null>(null);

  // Fetch branch name for branch managers
  useEffect(() => {
    const fetchBranchName = async () => {
      if (isBranchManager && userBranchId) {
        const { data } = await supabase
          .from('branches')
          .select('name')
          .eq('id', userBranchId)
          .single();
        if (data) {
          setBranchName(data.name.replace(' Showroom', ''));
        }
      }
    };
    fetchBranchName();
  }, [isBranchManager, userBranchId]);

  const adminTitle = isBranchManager && branchName 
    ? `New Sathiya Furniture Admin - ${branchName}` 
    : 'New Sathiya Furniture Admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Allow both admin and branch_manager roles to access the admin panel
  if (!isAdmin && !isBranchManager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access the admin panel.</p>
          <Link to="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter menu items based on role
  const filteredMenuItems = isAdmin 
    ? menuItems 
    : menuItems.filter(item => {
        // Branch managers can access these sections
        const allowedPaths = [
          '/admin',
          '/admin/stock',
          '/admin/stock-transfers',
          '/admin/damaged-stock',
          '/admin/products',
          '/admin/categories',
          '/admin/orders',
          '/admin/billing',
          '/admin/quotations',
          '/admin/reports',
        ];
        return allowedPaths.some(path => item.path.startsWith(path) || item.path === '/admin');
      });

  const NavItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location.pathname === item.path || 
      (item.children?.some(child => location.pathname === child.path));
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <Collapsible defaultOpen={isActive}>
          <CollapsibleTrigger className="w-full">
            <div 
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                isActive 
                  ? "bg-white/15 text-white" 
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {sidebarOpen && <span>{item.title}</span>}
              </div>
              {sidebarOpen && <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-6 mt-1 space-y-1">
              {item.children?.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                    location.pathname === child.path
                      ? "bg-emerald-500 text-white font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {child.title}
                </Link>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          isActive 
            ? "bg-emerald-500 text-white font-medium" 
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4" />
        {sidebarOpen && <span>{item.title}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
        style={{ 
          backgroundColor: 'hsl(220 25% 18%)', 
          borderColor: 'hsl(220 20% 28%)' 
        }}
      >
        {/* Logo */}
        <div 
          className="h-16 flex items-center justify-between px-4 border-b"
          style={{ borderColor: 'hsl(220 20% 28%)' }}
        >
          {sidebarOpen && (
            <span className="text-xl font-bold text-white">{adminTitle}</span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div 
          className="p-4 border-t space-y-2"
          style={{ borderColor: 'hsl(220 20% 28%)' }}
        >
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10 transition-colors"
          >
            <Home className="h-4 w-4" />
            {sidebarOpen && <span>Back to Store</span>}
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div 
        className="lg:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 border-b"
        style={{ 
          backgroundColor: 'hsl(220 25% 18%)', 
          borderColor: 'hsl(220 20% 28%)' 
        }}
      >
        <span className="text-xl font-bold text-white">{adminTitle}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-16 z-40 overflow-y-auto"
          style={{ backgroundColor: 'hsl(220 25% 18%)' }}
        >
          <nav className="p-4 space-y-2">
            {filteredMenuItems.map((item) => (
              <div key={item.path} onClick={() => !item.children && setMobileMenuOpen(false)}>
                <NavItem item={item} />
              </div>
            ))}
          </nav>
          <div 
            className="p-4 border-t space-y-2"
            style={{ borderColor: 'hsl(220 20% 28%)' }}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10"
            >
              <Home className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>
            <button
              onClick={() => { signOut(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:overflow-auto">
        <div className="lg:hidden h-16" /> {/* Spacer for mobile header */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
