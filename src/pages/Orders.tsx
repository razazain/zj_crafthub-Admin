import { Search, ChevronLeft, ChevronRight, X, Package, Eye, Edit3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
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
interface Product {
  _id: string;
  name: string;
  price: number;
  images: {
    url: string;
    alt: string;
    _id: string;
  }[];
}

interface OrderProduct {
  product: Product | null;
  quantity: number;
  _id: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  profileImage: {
    url: string;
    alt: string;
  };
}

interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  _id: string;
  orderNumber: number;
  user: User;
  products: OrderProduct[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  paymentScreenshot: string;
  status: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  total?: number;
}

// Status options from enum
const ORDER_STATUSES = [
  "pending_verification",
  "confirmed", 
  "shipped", 
  "delivered", 
  "cancelled"
] as const;

type OrderStatus = typeof ORDER_STATUSES[number];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    orders: false,
    updateStatus: false
  });

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusOrder, setSelectedStatusOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending_verification');

  // Pagination states
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0
  });

  /* -------------------- Helper Functions for Safe Data Access -------------------- */
  const getSafeUserName = (user: any): string => {
    return user?.name || 'N/A';
  };

  const getSafeUserEmail = (user: any): string => {
    return user?.email || 'N/A';
  };

  const getSafeUserPhone = (user: any): string => {
    return user?.phoneNumber || 'N/A';
  };

  const getSafeProductName = (product: any): string => {
    return product?.name || 'Product Not Available';
  };

  const getSafeProductPrice = (product: any): number => {
    const price = product?.price;
    return typeof price === 'number' && !isNaN(price) ? price : 0;
  };

  const getSafeQuantity = (item: any): number => {
    const qty = item?.quantity;
    return typeof qty === 'number' && !isNaN(qty) && qty > 0 ? qty : 0;
  };

  const getSafeDate = (dateString: string): string => {
    try {
      return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    } catch {
      return 'Invalid Date';
    }
  };

  const getSafeDateTime = (dateString: string): string => {
    try {
      return dateString ? new Date(dateString).toLocaleString() : 'N/A';
    } catch {
      return 'Invalid Date';
    }
  };

  const getOrderStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pending_verification': 'bg-yellow-100 text-yellow-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'shipped': 'bg-purple-100 text-purple-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getOrderStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending_verification': 'Pending Verification',
      'confirmed': 'Confirmed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const getTotalItems = (products: OrderProduct[]): number => {
    if (!Array.isArray(products)) return 0;
    return products.reduce((total, item) => {
      return total + getSafeQuantity(item);
    }, 0);
  };

  const getValidProductsCount = (products: OrderProduct[]): number => {
    if (!Array.isArray(products)) return 0;
    return products.filter(item => item.product !== null).length;
  };

  /* -------------------- Fetch Orders -------------------- */
  const fetchOrders = async (page = pagination.currentPage) => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const token = getToken();
      const searchParam = searchQuery ? searchQuery : '';
      
      const res = await fetch(
        `${API_URL}/orders?page=${page}&limit=${pagination.limit}&search=${searchParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      console.log('Fetched orders data:', data);
      
      if (data.success) {
        // Filter and validate orders data
        const validOrders = (data.orders || [])
          .filter((order: any) => order && order._id)
          .map((order: any) => ({
            ...order,
            products: Array.isArray(order.products) ? order.products : []
          }));
        
        setOrders(validOrders);
        setPagination({
          currentPage: data.pagination?.currentPage || page,
          limit: data.pagination?.limit || 10,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
          total: data.totalOrders || 0
        });
      } else {
        setOrders([]);
        showToast('Error', data.message || 'Failed to load orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Error', 'Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* -------------------- Fetch Single Order Details -------------------- */
  const fetchOrderDetails = async (orderId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      
      if (data.success && data.order) {
        setSelectedOrder(data.order);
        setShowDetailsModal(true);
      } else {
        showToast('Error', data.message || 'Failed to load order details', 'error');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showToast('Error', 'Failed to load order details', 'error');
    }
  };

  /* -------------------- Update Order Status -------------------- */
  const handleStatusUpdate = async () => {
    if (!selectedStatusOrder) return;

    setLoading(prev => ({ ...prev, updateStatus: true }));
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/orders/${selectedStatusOrder._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        showToast('Success', 'Order status updated successfully', 'success');
        
        // Update the order in the list
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === selectedStatusOrder._id 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        setShowStatusModal(false);
        setSelectedStatusOrder(null);
        setNewStatus('pending_verification');
      } else {
        showToast('Error', data.message || 'Failed to update status', 'error');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      showToast('Error', error.message || 'Failed to update status', 'error');
    } finally {
      setLoading(prev => ({ ...prev, updateStatus: false }));
    }
  };

  /* -------------------- Handlers -------------------- */
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchOrders(page);
  };

  const handleViewOrder = (order: Record<string, unknown>) => {
    const orderData = order as unknown as Order;
    fetchOrderDetails(orderData._id);
  };

  const handleEditStatus = (order: Record<string, unknown>) => {
    const orderData = order as unknown as Order;
    setSelectedStatusOrder(orderData);
    setNewStatus(orderData.status as OrderStatus);
    setShowStatusModal(true);
  };

  /* -------------------- Table Columns -------------------- */
  const columns = [
    { 
      key: 'orderNumber', 
      label: 'Order #',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        return (
          <span className="font-medium text-[#d0a19b]">
            #{order.orderNumber}
          </span>
        );
      }
    },
    { 
      key: 'user', 
      label: 'Customer',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        return (
          <div className="flex items-center gap-3">
            {order.user?.profileImage?.url ? (
              <img 
                src={order.user.profileImage.url} 
                alt={order.user.profileImage.alt || getSafeUserName(order.user)}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">NA</div>';
                  }
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                {getSafeUserName(order.user).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{getSafeUserName(order.user)}</p>
              <p className="text-xs text-gray-500">{getSafeUserEmail(order.user)}</p>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'products', 
      label: 'Products',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        const totalItems = getTotalItems(order.products);
        const validProducts = getValidProductsCount(order.products);
        return (
          <div>
            <p className="font-medium">{order.products?.length || 0} unique items</p>
            <p className="text-xs text-gray-500">Total quantity: {totalItems}</p>
            {validProducts < (order.products?.length || 0) && (
              <p className="text-xs text-orange-500 mt-1">
                {order.products?.length - validProducts} unavailable
              </p>
            )}
          </div>
        );
      }
    },
    { 
      key: 'total', 
      label: 'Total Amount',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        return (
          <span className="font-medium text-[#d0a19b]">
            Rs. {order.total?.toLocaleString() || 0}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
            {getOrderStatusText(order.status)}
          </span>
        );
      },
    },
    { 
      key: 'createdAt', 
      label: 'Order Date',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        return <span>{getSafeDate(order.createdAt)}</span>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, row: Record<string, unknown>) => {
        const order = row as unknown as Order;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleViewOrder(order)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => handleEditStatus(order)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Update Status"
            >
              <Edit3 size={18} />
            </button>
          </div>
        );
      }
    }
  ];

  /* -------------------- Pagination Component -------------------- */
  const PaginationFooter = () => {
    const { currentPage, totalPages, limit, total = 0 } = pagination;

    return (
      <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * limit, total)}</span> of{' '}
              <span className="font-medium">{total}</span> orders
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading.orders}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading.orders}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? 'z-10 bg-[#d0a19b] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d0a19b]'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage || loading.orders}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------- Order Details Modal -------------------- */
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Order Details #{selectedOrder.orderNumber}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {getSafeDateTime(selectedOrder.createdAt)}
              </p>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Order Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Order Status:</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getOrderStatusColor(selectedOrder.status)}`}>
                  {getOrderStatusText(selectedOrder.status)}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  {selectedOrder.user?.profileImage?.url ? (
                    <img 
                      src={selectedOrder.user.profileImage.url} 
                      alt={selectedOrder.user.profileImage.alt || getSafeUserName(selectedOrder.user)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                      {getSafeUserName(selectedOrder.user).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{getSafeUserName(selectedOrder.user)}</p>
                    <p className="text-sm text-gray-600">{getSafeUserEmail(selectedOrder.user)}</p>
                    <p className="text-sm text-gray-600">{getSafeUserPhone(selectedOrder.user)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Shipping Address</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.addressLine}</p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                </p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.country}</p>
                <p className="text-sm text-gray-600 mt-2">Phone: {selectedOrder.shippingAddress?.phoneNumber}</p>
                <p className="text-sm text-gray-600">Email: {selectedOrder.shippingAddress?.email}</p>
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Products</h3>
              <div className="space-y-4">
                {selectedOrder.products && selectedOrder.products.length > 0 ? (
                  selectedOrder.products.map((item, index) => {
                    const product = item.product;
                    const productName = getSafeProductName(product);
                    const productPrice = getSafeProductPrice(product);
                    const quantity = getSafeQuantity(item);
                    const total = productPrice * quantity;
                    const images = product?.images || [];
                    const imageUrl = images[0]?.url;

                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${!product ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Product Image */}
                          <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Package size={32} /></div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package size={32} />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-gray-800">{productName}</h4>
                                {!product && (
                                  <p className="text-xs text-red-600 mt-1">Product no longer available</p>
                                )}
                                {product && (
                                  <p className="text-xs text-gray-500">Product ID: {product._id}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Price</p>
                                <p className="font-medium text-[#d0a19b]">Rs. {productPrice.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Quantity</p>
                                <p className="font-medium">{quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="font-medium">Rs. {total.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No products found</p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="font-medium">Rs. {selectedOrder.subtotal?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Charges</p>
                    <p className="font-medium">Rs. {selectedOrder.deliveryCharges?.toLocaleString() || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-[#d0a19b]">Rs. {selectedOrder.total?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                {selectedOrder.paymentScreenshot && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Payment Screenshot</p>
                    <a 
                      href={selectedOrder.paymentScreenshot} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img 
                        src={selectedOrder.paymentScreenshot} 
                        alt="Payment Screenshot"
                        className="w-48 h-48 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Timeline</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Created:</span>
                    <span className="font-medium">{getSafeDateTime(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{getSafeDateTime(selectedOrder.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <Button
              onClick={() => setShowDetailsModal(false)}
              className="w-full bg-gradient-to-r from-[#d0a19b] to-[#e8c3bd] text-white border-0"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------- Status Update Modal -------------------- */
  const StatusUpdateModal = () => {
    if (!selectedStatusOrder) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Update Order Status</h2>
            <p className="text-sm text-gray-500 mt-1">
              Order #{selectedStatusOrder.orderNumber}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <div className={`px-3 py-2 text-sm font-medium rounded-lg inline-block ${getOrderStatusColor(selectedStatusOrder.status)}`}>
                {getOrderStatusText(selectedStatusOrder.status)}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getOrderStatusText(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatusOrder(null);
                  setNewStatus('pending_verification');
                }}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={loading.updateStatus || newStatus === selectedStatusOrder.status}
                className="flex-1 bg-gradient-to-r from-[#d0a19b] to-[#e8c3bd] text-white border-0 disabled:opacity-50"
              >
                {loading.updateStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter orders for search (client-side filtering as backup, but API already handles search)
  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toString().includes(searchQuery) ||
    getSafeUserName(order.user).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSafeUserEmail(order.user).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#4B5563]">Orders</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order #, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
              disabled={loading.orders}
            />
          </div>
        </div>

        {loading.orders ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d0a19b] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={filteredOrders as Record<string, unknown>[]}
              />
            </div>
            
            {/* Pagination */}
            {orders.length > 0 && (
              <PaginationFooter />
            )}

            {orders.length === 0 && !loading.orders && (
              <div className="text-center py-10">
                <Package className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Order Details Modal */}
      {showDetailsModal && <OrderDetailsModal />}

      {/* Status Update Modal */}
      {showStatusModal && <StatusUpdateModal />}
    </div>
  );
}