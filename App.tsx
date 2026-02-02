import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";

// Customer Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Account from "./pages/Account";
import Addresses from "./pages/Addresses";
import Security from "./pages/Security";
import ReturnsInfo from "./pages/ReturnsInfo";
import Wishlist from "./pages/Wishlist";
import CustomOrders from "./pages/CustomOrders";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import Install from "./pages/Install";

// Branch Pages
import BranchIndex from "./pages/branch/BranchIndex";
import BranchShop from "./pages/branch/BranchShop";
import BranchAdmin from "./pages/branch/BranchAdmin";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Categories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import OrderDetailAdmin from "./pages/admin/OrderDetailAdmin";
import Returns from "./pages/admin/Returns";
import Customers from "./pages/admin/Customers";
import Billing from "./pages/admin/Billing";
import BillingForm from "./pages/admin/BillingForm";
import Quotations from "./pages/admin/Quotations";
import QuotationForm from "./pages/admin/QuotationForm";
import AdminCustomOrders from "./pages/admin/CustomOrders";
import Reports from "./pages/admin/Reports";
import PageContent from "./pages/admin/PageContent";
import Reviews from "./pages/admin/Reviews";
import BlogPosts from "./pages/admin/BlogPosts";
import BlogPostForm from "./pages/admin/BlogPostForm";
import Messages from "./pages/admin/Messages";
import Settings from "./pages/admin/Settings";
import UserManagement from "./pages/admin/UserManagement";
import PaymentVerification from "./pages/admin/PaymentVerification";
import BannerManagement from "./pages/admin/BannerManagement";
import GalleryManagement from "./pages/admin/GalleryManagement";
import BranchManagement from "./pages/admin/BranchManagement";
import BranchDashboard from "./pages/admin/BranchDashboard";
import StockOverview from "./pages/admin/StockOverview";
import StockTransfers from "./pages/admin/StockTransfers";
import StockTransferDetail from "./pages/admin/StockTransferDetail";
import DamagedStock from "./pages/admin/DamagedStock";
import BranchManagerDashboard from "./pages/admin/BranchManagerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BranchProvider>
                <MaintenanceGuard>
                  <Routes>
                    {/* Customer Routes - wrapped with AdminRouteGuard to redirect pure admins */}
                    <Route path="/" element={<AdminRouteGuard><Index /></AdminRouteGuard>} />
                    <Route path="/about" element={<AdminRouteGuard><About /></AdminRouteGuard>} />
                    <Route path="/shop" element={<AdminRouteGuard><Shop /></AdminRouteGuard>} />
                    <Route path="/product/:slug" element={<AdminRouteGuard><ProductDetail /></AdminRouteGuard>} />
                    <Route path="/blog" element={<AdminRouteGuard><Blog /></AdminRouteGuard>} />
                    <Route path="/blog/:slug" element={<AdminRouteGuard><BlogPost /></AdminRouteGuard>} />
                    <Route path="/contact" element={<AdminRouteGuard><Contact /></AdminRouteGuard>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/cart" element={<AdminRouteGuard><Cart /></AdminRouteGuard>} />
                    <Route path="/checkout" element={<AdminRouteGuard><Checkout /></AdminRouteGuard>} />
                    <Route path="/orders" element={<AdminRouteGuard><Orders /></AdminRouteGuard>} />
                    <Route path="/orders/:id" element={<AdminRouteGuard><OrderDetail /></AdminRouteGuard>} />
                    <Route path="/account" element={<AdminRouteGuard><Account /></AdminRouteGuard>} />
                    <Route path="/addresses" element={<AdminRouteGuard><Addresses /></AdminRouteGuard>} />
                    <Route path="/security" element={<AdminRouteGuard><Security /></AdminRouteGuard>} />
                    <Route path="/returns-info" element={<AdminRouteGuard><ReturnsInfo /></AdminRouteGuard>} />
                    <Route path="/wishlist" element={<AdminRouteGuard><Wishlist /></AdminRouteGuard>} />
                    <Route path="/custom-orders" element={<AdminRouteGuard><CustomOrders /></AdminRouteGuard>} />
                    <Route path="/gallery" element={<AdminRouteGuard><Gallery /></AdminRouteGuard>} />
                    <Route path="/terms" element={<AdminRouteGuard><TermsOfService /></AdminRouteGuard>} />
                    <Route path="/privacy" element={<AdminRouteGuard><PrivacyPolicy /></AdminRouteGuard>} />
                    <Route path="/refund-policy" element={<AdminRouteGuard><RefundPolicy /></AdminRouteGuard>} />
                    <Route path="/install" element={<AdminRouteGuard><Install /></AdminRouteGuard>} />
                    
                    {/* Branch-specific Customer Routes */}
                    <Route path="/:branchSlug" element={<BranchIndex />} />
                    <Route path="/:branchSlug/shop" element={<BranchShop />} />
                    <Route path="/:branchSlug/product/:slug" element={<ProductDetail />} />
                    
                    {/* Branch-specific Admin Routes */}
                    <Route path="/:branchSlug/admin" element={<BranchAdmin />}>
                      <Route index element={<BranchManagerDashboard />} />
                      <Route path="products" element={<Products />} />
                      <Route path="products/new" element={<ProductForm />} />
                      <Route path="products/:id" element={<ProductForm />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="orders/:id" element={<OrderDetailAdmin />} />
                      <Route path="billing" element={<Billing />} />
                      <Route path="billing/new" element={<BillingForm />} />
                      <Route path="billing/:id" element={<BillingForm />} />
                      <Route path="quotations" element={<Quotations />} />
                      <Route path="quotations/new" element={<QuotationForm />} />
                      <Route path="quotations/:id" element={<QuotationForm />} />
                      <Route path="stock" element={<StockOverview />} />
                      <Route path="stock-transfers" element={<StockTransfers />} />
                      <Route path="stock-transfers/:id" element={<StockTransferDetail />} />
                      <Route path="damaged-stock" element={<DamagedStock />} />
                    </Route>
                    
                    {/* Global Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="branches" element={<BranchManagement />} />
                      <Route path="branches/:branchId" element={<BranchDashboard />} />
                      <Route path="stock" element={<StockOverview />} />
                      <Route path="stock-transfers" element={<StockTransfers />} />
                      <Route path="stock-transfers/:id" element={<StockTransferDetail />} />
                      <Route path="damaged-stock" element={<DamagedStock />} />
                      <Route path="products" element={<Products />} />
                      <Route path="products/new" element={<ProductForm />} />
                      <Route path="products/:id" element={<ProductForm />} />
                      <Route path="categories" element={<Categories />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="orders/:id" element={<OrderDetailAdmin />} />
                      <Route path="payments" element={<PaymentVerification />} />
                      <Route path="returns" element={<Returns />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="billing" element={<Billing />} />
                      <Route path="billing/new" element={<BillingForm />} />
                      <Route path="billing/:id" element={<BillingForm />} />
                      <Route path="quotations" element={<Quotations />} />
                      <Route path="quotations/new" element={<QuotationForm />} />
                      <Route path="quotations/:id" element={<QuotationForm />} />
                      <Route path="custom-orders" element={<AdminCustomOrders />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="pages" element={<PageContent />} />
                      <Route path="banners" element={<BannerManagement />} />
                      <Route path="gallery" element={<GalleryManagement />} />
                      <Route path="reviews" element={<Reviews />} />
                      <Route path="blog" element={<BlogPosts />} />
                      <Route path="blog/new" element={<BlogPostForm />} />
                      <Route path="blog/:id" element={<BlogPostForm />} />
                      <Route path="messages" element={<Messages />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    
                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MaintenanceGuard>
              </BranchProvider>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
