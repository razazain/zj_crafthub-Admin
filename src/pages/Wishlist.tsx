import { Search, ChevronLeft, ChevronRight, X, Package, User } from 'lucide-react';
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
interface ProfileImage {
  url: string;
  alt: string;
  isVerified?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  profileImage?: ProfileImage;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductImage {
  url: string;
  alt: string;
  _id: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Ratings {
  average: number;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: Category;
  images: ProductImage[];
  tags?: string[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  status?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  ratings?: Ratings;
}

interface WishlistItem {
  _id: string;
  user: string | User; // Can be user ID or populated user object
  product: string | Product; // Can be product ID or populated product object
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalRecords: number;
}

interface ApiResponse {
  success: boolean;
  wishlists: WishlistItem[];
  pagination: Pagination;
  message?: string;
}

interface ProductApiResponse {
  success: boolean;
  product: Product;
}

interface UserApiResponse {
  success: boolean;
  user?: User;
  profileImage?: ProfileImage;
  _id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
}

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination states
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    totalRecords: 0
  });

  /* -------------------- Helper Functions for Safe Data Access -------------------- */
  const getSafeUserId = (user: string | User): string => {
    if (typeof user === 'string') return user;
    return user?._id || 'N/A';
  };

  const getSafeUserName = (user: string | User): string => {
    if (typeof user === 'string') return 'User';
    return user?.name || 'N/A';
  };

  const getSafeUserEmail = (user: string | User): string => {
    if (typeof user === 'string') return 'Email not available';
    return user?.email || 'N/A';
  };

  const getUserProfileImage = (user: string | User): string | null => {
    if (typeof user === 'string') return null;
    return user?.profileImage?.url || null;
  };

  const getUserProfileAlt = (user: string | User): string => {
    if (typeof user === 'string') return 'User';
    return user?.profileImage?.alt || getSafeUserName(user);
  };

  const getSafeProductId = (product: string | Product): string => {
    if (typeof product === 'string') return product;
    return product?._id || 'N/A';
  };

  const getSafeProductName = (product: string | Product): string => {
    if (typeof product === 'string') return 'Product';
    return product?.name || 'Product Not Available';
  };

  const getSafeProductPrice = (product: string | Product): number => {
    if (typeof product === 'string') return 0;
    const price = product?.price;
    return typeof price === 'number' && !isNaN(price) ? price : 0;
  };

  const getProductImage = (product: string | Product): string | null => {
    if (typeof product === 'string') return null;
    return product?.images?.[0]?.url || null;
  };

  const getProductAlt = (product: string | Product): string => {
    if (typeof product === 'string') return 'Product';
    return product?.images?.[0]?.alt || getSafeProductName(product);
  };

  const getSafeDate = (dateString: string): string => {
    try {
      return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    } catch {
      return 'Invalid Date';
    }
  };

  /* -------------------- Fetch Single Product -------------------- */
  const fetchProductById = async (productId: string): Promise<Product | null> => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data: ProductApiResponse = await res.json();
      
      if (data.success && data.product) {
        return data.product;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  /* -------------------- Fetch Single User -------------------- */
  const fetchUserById = async (userId: string): Promise<User | null> => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data: UserApiResponse = await res.json();
      
      // Handle different response structures
      if (data.success && data.user) {
        return data.user;
      } else if (data._id) {
        // If the response is directly the user object
        return data as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  /* -------------------- Fetch Wishlist Items -------------------- */
  const fetchWishlistItems = async (page = pagination.currentPage) => {
    setLoading(true);
    try {
      const token = getToken();
      const searchParam = searchQuery ? searchQuery : '';
      
      const res = await fetch(
        `${API_URL}/wishlist/all?page=${page}&limit=${pagination.limit}&search=${searchParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data: ApiResponse = await res.json();
      console.log('Fetched wishlist data:', data);
      
      if (data.success) {
        // Filter and validate wishlist data (allow null/string values)
        const validWishlistItems = (data.wishlists || [])
          .filter((item: WishlistItem) => item && item._id);
        
        setWishlistItems(validWishlistItems);
        setPagination({
          currentPage: data.pagination?.currentPage || page,
          limit: data.pagination?.limit || 10,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
          totalRecords: data.pagination?.totalRecords || 0
        });
      } else {
        setWishlistItems([]);
        showToast('Error', data.message || 'Failed to load wishlist items', 'error');
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      showToast('Error', 'Failed to load wishlist items', 'error');
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistItems(1);
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWishlistItems(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* -------------------- Handlers -------------------- */
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchWishlistItems(page);
  };

  const handleViewProduct = async (item: Record<string, unknown>) => {
    const wishlistItem = item as unknown as WishlistItem;
    const productId = getSafeProductId(wishlistItem.product);
    
    if (!productId || productId === 'N/A') {
      showToast('Error', 'Product information not available', 'error');
      return;
    }

    setModalLoading(true);
    setShowProductModal(true);
    
    try {
      // If product is already populated, use it
      if (typeof wishlistItem.product !== 'string' && wishlistItem.product) {
        setSelectedProduct(wishlistItem.product as Product);
      } else {
        // Fetch full product details
        const product = await fetchProductById(productId);
        setSelectedProduct(product);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      showToast('Error', 'Failed to load product details', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewUser = async (item: Record<string, unknown>) => {
    const wishlistItem = item as unknown as WishlistItem;
    const userId = getSafeUserId(wishlistItem.user);
    
    if (!userId || userId === 'N/A') {
      showToast('Error', 'User information not available', 'error');
      return;
    }

    setModalLoading(true);
    setShowUserModal(true);
    
    try {
      // If user is already populated, use it
      if (typeof wishlistItem.user !== 'string' && wishlistItem.user) {
        setSelectedUser(wishlistItem.user as User);
      } else {
        // Fetch full user details
        const user = await fetchUserById(userId);
        setSelectedUser(user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      showToast('Error', 'Failed to load user details', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (item: Record<string, unknown>) => {
    const wishlistItem = item as unknown as WishlistItem;
    
    const result = await Swal.fire({
      title: 'Remove from Wishlist?',
      text: `Are you sure you want to remove "${getSafeProductName(wishlistItem.product)}" from wishlist?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/wishlist/${wishlistItem._id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          showToast('Success', 'Item removed from wishlist', 'success');
          // Refresh the list
          fetchWishlistItems(pagination.currentPage);
        } else {
          showToast('Error', data.message || 'Failed to remove item', 'error');
        }
      } catch (error) {
        console.error('Error deleting wishlist item:', error);
        showToast('Error', 'Failed to remove item', 'error');
      }
    }
  };

  /* -------------------- Table Columns -------------------- */
  const columns = [
    { 
      key: 'user', 
      label: 'User',
      render: (value: unknown, row: Record<string, unknown>) => {
        const item = row as unknown as WishlistItem;
        const userId = getSafeUserId(item.user);
        const userName = getSafeUserName(item.user);
        const userEmail = getSafeUserEmail(item.user);
        const profileImage = getUserProfileImage(item.user);
        
        return (
          <button
            onClick={() => handleViewUser(row)}
            className="flex items-center gap-3 text-left hover:text-[#d0a19b] transition-colors group"
          >
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={getUserProfileAlt(item.user)}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><User size={14} class="text-gray-500" /></div>';
                  }
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={14} className="text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 group-hover:underline">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          </button>
        );
      }
    },
    { 
      key: 'product', 
      label: 'Product',
      render: (value: unknown, row: Record<string, unknown>) => {
        const item = row as unknown as WishlistItem;
        const productId = getSafeProductId(item.product);
        const productName = getSafeProductName(item.product);
        const imageUrl = getProductImage(item.product);
        
        return (
          <button
            onClick={() => handleViewProduct(row)}
            className="flex items-center gap-3 text-left hover:text-[#d0a19b] transition-colors group"
          >
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={getProductAlt(item.product)}
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center"><Package size={16} class="text-gray-400" /></div>';
                  }
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                <Package size={16} className="text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium group-hover:underline">{productName}</p>
            </div>
          </button>
        );
      }
    },
    { 
      key: 'price', 
      label: 'Price',
      render: (value: unknown, row: Record<string, unknown>) => {
        const item = row as unknown as WishlistItem;
        const price = getSafeProductPrice(item.product);
        return (
          <span className="font-medium text-[#d0a19b]">
            Rs. {price.toLocaleString()}
          </span>
        );
      }
    },
    { 
      key: 'addedOn', 
      label: 'Added On',
      render: (value: unknown, row: Record<string, unknown>) => {
        const item = row as unknown as WishlistItem;
        return <span>{getSafeDate(item.createdAt)}</span>;
      }
    },
    {
      key: 'inStock',
      label: 'Availability',
      render: (value: unknown, row: Record<string, unknown>) => {
        // Note: The API doesn't provide stock status, so we'll show a placeholder
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-100">
            Available
          </span>
        );
      },
    },
  ];

  /* -------------------- Pagination Component -------------------- */
  const PaginationFooter = () => {
    const { currentPage, totalPages, limit, totalRecords } = pagination;

    return (
      <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * limit, totalRecords)}</span> of{' '}
              <span className="font-medium">{totalRecords}</span> items
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
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
                    disabled={loading}
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
                disabled={!pagination.hasNextPage || loading}
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

  /* -------------------- Product Modal Component -------------------- */
  const ProductModal = () => {
    if (!selectedProduct && !modalLoading) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
            <button
              onClick={() => setShowProductModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {modalLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d0a19b] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading product details...</p>
                </div>
              </div>
            ) : selectedProduct ? (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="w-full md:w-64 h-64 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {getProductImage(selectedProduct) ? (
                    <img
                      src={getProductImage(selectedProduct)!}
                      alt={getProductAlt(selectedProduct)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Package size={48} /></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={48} />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedProduct.name}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* <div>
                      <p className="text-sm text-gray-500">Product ID</p>
                      <p className="font-mono text-sm">{selectedProduct._id}</p>
                    </div> */}

                    {selectedProduct.description && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-sm">{selectedProduct.description}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="text-3xl font-bold text-[#d0a19b]">
                        Rs. {selectedProduct.price.toLocaleString()}
                      </p>
                    </div>

                    {selectedProduct.category && (
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="text-sm font-medium">{selectedProduct.category.name}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.isBestSeller && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Best Seller
                        </span>
                      )}
                      {selectedProduct.isFeatured && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                      {selectedProduct.isNewArrival && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          New Arrival
                        </span>
                      )}
                      {selectedProduct.status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedProduct.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedProduct.status}
                        </span>
                      )}
                    </div>

                    {/* All Images */}
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">All Images ({selectedProduct.images.length})</p>
                        <div className="grid grid-cols-4 gap-2">
                          {selectedProduct.images.map((image, index) => (
                            <div key={image._id || index} className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={image.url}
                                alt={image.alt || selectedProduct.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><Package size={16} /></div>';
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-2">
                      {selectedProduct.createdAt && (
                        <div>
                          <span className="font-medium">Created:</span> {getSafeDate(selectedProduct.createdAt)}
                        </div>
                      )}
                      {selectedProduct.updatedAt && (
                        <div>
                          <span className="font-medium">Updated:</span> {getSafeDate(selectedProduct.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500">Product not found</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <Button
              onClick={() => setShowProductModal(false)}
              className="w-full bg-gradient-to-r from-[#d0a19b] to-[#e8c3bd] text-white border-0"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------- User Modal Component -------------------- */
  const UserModal = () => {
    if (!selectedUser && !modalLoading) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">User Details</h2>
            <button
              onClick={() => setShowUserModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {modalLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d0a19b] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading user details...</p>
                </div>
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex justify-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-full overflow-hidden">
                    {selectedUser.profileImage?.url ? (
                      <img
                        src={selectedUser.profileImage.url}
                        alt={selectedUser.profileImage.alt || selectedUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><User size={48} /></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h3>
                    {selectedUser.isVerified && (
                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4">
                    {/* <div>
                      <p className="text-sm text-gray-500">User ID</p>
                      <p className="font-mono text-sm">{selectedUser._id}</p>
                    </div> */}

                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>

                    {selectedUser.phoneNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="text-sm">{selectedUser.phoneNumber}</p>
                      </div>
                    )}

                    {selectedUser.role && (
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="text-sm capitalize">{selectedUser.role}</p>
                      </div>
                    )}

                    {selectedUser.createdAt && (
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-sm">{getSafeDate(selectedUser.createdAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <User className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500">User not found</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <Button
              onClick={() => setShowUserModal(false)}
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
      <h1 className="text-3xl font-bold text-[#4B5563]">Wishlist Items</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by user name or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
              disabled={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d0a19b] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading wishlist items...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={wishlistItems as Record<string, unknown>[]}
                onView={handleViewProduct}
                onDelete={handleDelete}
              />
            </div>
            
            {/* Pagination */}
            {wishlistItems.length > 0 && (
              <PaginationFooter />
            )}

            {wishlistItems.length === 0 && !loading && (
              <div className="text-center py-10">
                <p className="text-gray-500">No wishlist items found</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modals */}
      {showProductModal && <ProductModal />}
      {showUserModal && <UserModal />}
    </div>
  );
}