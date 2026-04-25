import { Package, FileText, Users, Mail, TrendingUp, ShoppingCart, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import { NavLink } from 'react-router-dom';
import { API_URL } from '../config';
import { getToken } from '../utils/auth';

/* -------------------- Toast -------------------- */
const showToast = (
  title: string,
  message: string,
  icon: 'success' | 'error' | 'warning'
) => {
  Swal.fire({
    title,
    text: message,
    icon,
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
};

/* -------------------- Types -------------------- */
interface Stats {
  totalProducts: { count: number; change: number };
  totalOrders: { count: number; change: number };
  registeredUsers: { count: number; change: number };
  newLeads: { count: number; change: number };
}

interface StatsResponse {
  success: boolean;
  stats: Stats;
}

interface OrderProduct {
  product: {
    _id: string;
    name: string;
    price: number;
    images: Array<{ url: string; alt: string; _id: string }>;
  } | null;
  quantity: number;
  _id: string;
}

interface Order {
  _id: string;
  orderNumber: number;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    profileImage?: { url: string; alt: string };
  };
  products: OrderProduct[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  totalOrders: number;
  pagination: {
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  orders: Order[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Helper: Format trend text from change percentage
  const formatTrend = (change: number): string => {
    if (change > 0) return `+${change}% from last month`;
    if (change < 0) return `${change}% from last month`;
    return 'No change from last month';
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: StatsResponse = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        showToast('Error', 'Failed to load dashboard stats', 'error');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Error', 'Failed to load dashboard stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch recent orders (limit 5)
  const fetchRecentOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/orders?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: OrdersResponse = await res.json();
      if (data.success) {
        setRecentOrders(data.orders);
      } else {
        showToast('Error', 'Failed to load recent orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Error', 'Failed to load recent orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchStats();
    fetchRecentOrders();
  };

  // Helper to get product names from an order (filter out null products)
  const getProductNames = (order: Order): string => {
    const names = order.products
      .filter(p => p.product !== null)
      .map(p => p.product!.name);
    return names.join(', ') || 'Product unavailable';
  };

  // Helper to format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Helper to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Prepare stats array for StatCard components
  const statItems = stats
    ? [
        {
          title: 'Total Products',
          value: stats.totalProducts.count.toString(),
          icon: Package,
          trend: formatTrend(stats.totalProducts.change),
          color: '#D0A19B',
        },
        {
          title: 'Total Orders',
          value: stats.totalOrders.count.toString(),
          icon: FileText,
          trend: formatTrend(stats.totalOrders.change),
          color: '#4B5563',
        },
        {
          title: 'Registered Users',
          value: stats.registeredUsers.count.toString(),
          icon: Users,
          trend: formatTrend(stats.registeredUsers.change),
          color: '#D0A19B',
        },
        {
          title: 'New Leads',
          value: stats.newLeads.count.toString(),
          icon: Mail,
          trend: formatTrend(stats.newLeads.change),
          color: '#4B5563',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#4B5563]">Dashboard</h1>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-[#D0A19B] transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>Overview</span>
        </div>
      </div>

      {/* Stats Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 rounded-xl p-6 h-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card */}
        <Card title="Recent Orders">
          {loadingOrders ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 rounded-lg p-4 h-20"></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#4B5563]">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {getProductNames(order)} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#D0A19B]">
                      Rs. {order.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loadingOrders && recentOrders.length > 0 && (
            <div className="mt-4 text-right">
              <NavLink
                to="/orders"
                className="text-sm text-[#D0A19B] hover:underline"
              >
                View all orders →
              </NavLink>
            </div>
          )}
        </Card>

        {/* Quick Actions Card (unchanged) */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            <NavLink
              to="/products"
              className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group"
            >
              <Package
                size={32}
                className="mb-2 text-[#D0A19B] group-hover:text-white"
              />
              <span className="font-medium text-[#4B5563] group-hover:text-white">
                View Products
              </span>
            </NavLink>
            <NavLink
              to="/orders"
              className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group"
            >
              <ShoppingCart
                size={32}
                className="mb-2 text-[#D0A19B] group-hover:text-white"
              />
              <span className="font-medium text-[#4B5563] group-hover:text-white">
                View Orders
              </span>
            </NavLink>
            <NavLink
              to="/users"
              className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group"
            >
              <Users
                size={32}
                className="mb-2 text-[#D0A19B] group-hover:text-white"
              />
              <span className="font-medium text-[#4B5563] group-hover:text-white">
                Manage Users
              </span>
            </NavLink>
            <NavLink
              to="/leads"
              className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group"
            >
              <Mail
                size={32}
                className="mb-2 text-[#D0A19B] group-hover:text-white"
              />
              <span className="font-medium text-[#4B5563] group-hover:text-white">
                View Leads
              </span>
            </NavLink>
          </div>
        </Card>
      </div>
    </div>
  );
}