import { Search, ChevronLeft, ChevronRight, X, Package } from 'lucide-react';
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
  status: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  status: string;
  statusUpdatedAt: string;
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

interface Cart {
  _id: string;
  user: User;
  items: CartItem[];
  status: string;
  statusUpdatedAt: string;
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

export default function Cart() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    carts: false
  });

  // Modal states
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);

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

  const getSafeCartStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Active',
      'cart_cleared': 'Cart Cleared',
      'ordered': 'Ordered'
    };
    return statusMap[status] || status || 'Unknown';
  };

  const getSafeItemStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'added': 'Added',
      'quantity_updated': 'Quantity Updated',
      'product_removed': 'Product Removed',
      'ordered': 'Ordered'
    };
    return statusMap[status] || status || 'Unknown';
  };

  const getCartItemCount = (items: any[]): number => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      return total + getSafeQuantity(item);
    }, 0);
  };

  const getCartTotal = (items: any[]): number => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      const price = getSafeProductPrice(item?.product);
      const quantity = getSafeQuantity(item);
      return total + (price * quantity);
    }, 0);
  };

  const getCartStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700',
      'cart_cleared': 'bg-orange-100 text-orange-700',
      'ordered': 'bg-purple-100 text-purple-700',
      'unknown': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.unknown;
  };

  const getItemStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'added': 'bg-blue-100 text-blue-700',
      'quantity_updated': 'bg-yellow-100 text-yellow-700',
      'product_removed': 'bg-red-100 text-red-700',
      'ordered': 'bg-purple-100 text-purple-700',
      'unknown': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.unknown;
  };

  /* -------------------- Fetch Carts -------------------- */
  const fetchCarts = async (page = pagination.currentPage) => {
    setLoading(prev => ({ ...prev, carts: true }));
    try {
      const token = getToken();
      const searchParam = searchQuery ? searchQuery : '';
      
      const res = await fetch(
        `${API_URL}/cart/admin/all?page=${page}&limit=${pagination.limit}&search=${searchParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      console.log('Fetched carts data:', data);
      
      if (data.success) {
        // Filter and validate carts data
        const validCarts = (data.carts || [])
          .filter((cart: any) => cart && cart._id && cart.user)
          .map((cart: any) => ({
            ...cart,
            items: Array.isArray(cart.items) ? cart.items : []
          }));
        
        setCarts(validCarts);
        setPagination({
          currentPage: data.pagination?.currentPage || page,
          limit: data.pagination?.limit || 10,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
          total: data.totalCarts || 0
        });
      } else {
        setCarts([]);
        showToast('Error', data.message || 'Failed to load carts', 'error');
      }
    } catch (error) {
      console.error('Error fetching carts:', error);
      showToast('Error', 'Failed to load carts', 'error');
      setCarts([]);
    } finally {
      setLoading(prev => ({ ...prev, carts: false }));
    }
  };

  useEffect(() => {
    fetchCarts(1);
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCarts(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* -------------------- Handlers -------------------- */
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchCarts(page);
  };

  const handleViewItems = (cart: Cart) => {
    setSelectedCart(cart);
    setShowItemsModal(true);
  };

  /* -------------------- Table Columns -------------------- */
  const columns = [
    { 
      key: 'user', 
      label: 'User',
      render: (value: unknown, row: Record<string, unknown>) => {
        const cart = row as unknown as Cart;
        return (
          <div className="flex items-center gap-3">
            {cart.user?.profileImage?.url ? (
              <img 
                src={cart.user.profileImage.url} 
                alt={cart.user.profileImage.alt || getSafeUserName(cart.user)}
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
                {getSafeUserName(cart.user).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{getSafeUserName(cart.user)}</p>
              <p className="text-xs text-gray-500">{getSafeUserEmail(cart.user)}</p>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'items', 
      label: 'Items',
      render: (value: unknown, row: Record<string, unknown>) => {
        const cart = row as unknown as Cart;
        const itemCount = getCartItemCount(cart.items);
        const uniqueItems = cart.items?.length || 0;
        const activeItems = cart.items?.filter(item => !['product_removed', 'ordered'].includes(item.status)).length || 0;
        
        return (
          <button
            onClick={() => handleViewItems(cart)}
            className="text-left hover:text-[#d0a19b] transition-colors group"
          >
            <p className="font-medium group-hover:underline">{uniqueItems} unique items</p>
            <p className="text-xs text-gray-500">Total quantity: {itemCount}</p>
            {activeItems < uniqueItems && (
              <p className="text-xs text-orange-500 mt-1">{activeItems} active, {uniqueItems - activeItems} inactive</p>
            )}
          </button>
        );
      }
    },
    { 
      key: 'total', 
      label: 'Total Amount',
      render: (value: unknown, row: Record<string, unknown>) => {
        const cart = row as unknown as Cart;
        const total = getCartTotal(cart.items);
        return (
          <span className="font-medium text-[#d0a19b]">
            Rs. {total.toLocaleString()}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Cart Status',
      render: (value: unknown, row: Record<string, unknown>) => {
        const cart = row as unknown as Cart;
        const safeStatus = getSafeCartStatus(cart.status);
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${getCartStatusColor(cart.status)}`}>
            {safeStatus}
          </span>
        );
      }
    },
    { 
      key: 'createdAt', 
      label: 'Created',
      render: (value: unknown, row: Record<string, unknown>) => {
        const cart = row as unknown as Cart;
        return <span>{getSafeDate(cart.createdAt)}</span>;
      }
    },
    { 
      key: 'updatedAt', 
      label: 'Last Updated',
      render: (value: unknown, row: Record<string, unknown>) => {
        const cart = row as unknown as Cart;
        return <span>{getSafeDate(cart.updatedAt)}</span>;
      }
    },
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
              <span className="font-medium">{total}</span> carts
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading.carts}
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
                    disabled={loading.carts}
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
                disabled={!pagination.hasNextPage || loading.carts}
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

  /* -------------------- Items Modal Component -------------------- */
  const ItemsModal = () => {
    if (!selectedCart) return null;

    // Filter items to show different categories
    const activeItems = selectedCart.items?.filter(item => !['product_removed', 'ordered'].includes(item.status)) || [];
    const removedItems = selectedCart.items?.filter(item => item.status === 'product_removed') || [];
    const orderedItems = selectedCart.items?.filter(item => item.status === 'ordered') || [];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Cart Items</h2>
              <p className="text-sm text-gray-500 mt-1">
                User: {getSafeUserName(selectedCart.user)} ({getSafeUserEmail(selectedCart.user)})
              </p>
            </div>
            <button
              onClick={() => setShowItemsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Status Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Filter by status:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Active: {activeItems.length}</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Removed: {removedItems.length}</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Ordered: {orderedItems.length}</span>
            </div>

            {selectedCart.items && selectedCart.items.length > 0 ? (
              <div className="space-y-4">
                {selectedCart.items.map((item, index) => {
                  const product = item.product || {};
                  const productName = getSafeProductName(product);
                  const productPrice = getSafeProductPrice(product);
                  const quantity = getSafeQuantity(item);
                  const total = productPrice * quantity;
                  const itemStatus = getSafeItemStatus(item.status);
                  const images = product.images || [];
                  const imageUrl = images[0]?.url;

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        item.status === 'product_removed' 
                          ? 'border-red-200 bg-red-50/30' 
                          : item.status === 'ordered'
                            ? 'border-purple-200 bg-purple-50/30'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Product Image */}
                        <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                              <h3 className="font-semibold text-gray-800">{productName}</h3>
                              <p className="text-xs text-gray-500 mt-1">Product ID: {product._id || 'N/A'}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                product.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {product.status || 'Unknown'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getItemStatusColor(item.status)}`}>
                                {itemStatus}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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
                            <div>
                              <p className="text-xs text-gray-500">Last Updated</p>
                              <p className="text-sm">{getSafeDate(item.statusUpdatedAt)}</p>
                            </div>
                          </div>

                          {/* Status specific badges */}
                          {item.status === 'product_removed' && (
                            <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                              ⚠️ This item was removed from cart by user
                            </div>
                          )}
                          {item.status === 'ordered' && (
                            <div className="mt-3 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                              ✅ This item has been ordered
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Cart Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Cart Status: 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getCartStatusColor(selectedCart.status)}`}>
                          {getSafeCartStatus(selectedCart.status)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Last Updated: {getSafeDate(selectedCart.statusUpdatedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Items: {selectedCart.items.length}</p>
                      <p className="text-sm text-gray-600">Total Quantity: {getCartItemCount(selectedCart.items)}</p>
                      <p className="text-lg font-semibold text-[#d0a19b] mt-1">
                        Grand Total: Rs. {getCartTotal(selectedCart.items).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500">No items in this cart</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <Button
              onClick={() => setShowItemsModal(false)}
              className="w-full bg-gradient-to-r from-[#d0a19b] to-[#e8c3bd] text-white border-0"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#4B5563]">Cart Items</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
              disabled={loading.carts}
            />
          </div>
        </div>

        {loading.carts ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d0a19b] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading carts...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={carts as Record<string, unknown>[]}
                // Removed onDelete prop
              />
            </div>
            
            {/* Pagination */}
            {carts.length > 0 && (
              <PaginationFooter />
            )}

            {carts.length === 0 && !loading.carts && (
              <div className="text-center py-10">
                <p className="text-gray-500">No carts found</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Items Modal */}
      {showItemsModal && <ItemsModal />}
    </div>
  );
}