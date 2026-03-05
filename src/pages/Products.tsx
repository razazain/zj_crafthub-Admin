import { useEffect, useState } from 'react';
import { Plus, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

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
interface Category {
  _id: string;
  name: string;
}

interface ProductImage {
  _id: string;
  url: string;
  alt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  status: string;
  category: {
    _id: string;
    name: string;
  };
  images: ProductImage[];
  tags: string[];
  isBestSeller: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  slug: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* -------------------- Component -------------------- */
export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filter, setFilter] = useState<'all' | 'bestseller'>('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination states
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState({
    products: false,
    categories: false,
    delete: false,
    submit: false,
    filter: false,
    view: false
  });

  /* -------------------- Fetch Products -------------------- */
  const fetchProducts = async (page = 1, status = statusFilter) => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(status !== 'all' && { status })
      }).toString();

      const res = await fetch(`${API_URL}/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page, limit: pagination.limit, totalPages: 1 });
      setSelectedCategory('');
      setFilter('all');
    } catch {
      showToast('Error', 'Failed to load products', 'error');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const fetchBestSeller = async (page = 1, status = statusFilter) => {
    setLoading(prev => ({ ...prev, filter: true }));
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(status !== 'all' && { status })
      }).toString();

      const res = await fetch(`${API_URL}/products/filter/bestseller?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page, limit: pagination.limit, totalPages: 1 });
      setSelectedCategory('');
      setFilter('bestseller');
    } catch {
      showToast('Error', 'Failed to load best sellers', 'error');
    } finally {
      setLoading(prev => ({ ...prev, filter: false }));
    }
  };

  const fetchByCategory = async (categoryId: string, page = 1, status = statusFilter) => {
    setLoading(prev => ({ ...prev, filter: true }));
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(status !== 'all' && { status })
      }).toString();

      const res = await fetch(`${API_URL}/products/category/${categoryId}?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page, limit: pagination.limit, totalPages: 1 });
      setSelectedCategory(categoryId);
      setFilter('all');
    } catch {
      showToast('Error', 'Failed to load category products', 'error');
    } finally {
      setLoading(prev => ({ ...prev, filter: false }));
    }
  };

  const fetchProductDetails = async (productId: string) => {
    setLoading(prev => ({ ...prev, view: true }));
    try {
      const res = await fetch(`${API_URL}/products/${productId}`);
      const data = await res.json();
      setViewingProduct(data.product);
      setShowViewModal(true);
    } catch {
      showToast('Error', 'Failed to load product details', 'error');
    } finally {
      setLoading(prev => ({ ...prev, view: false }));
    }
  };

  /* -------------------- Fetch Categories -------------------- */
  const fetchCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const res = await fetch(
        `${API_URL}/categories?status=active&page=1&limit=50`
      );
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      showToast('Error', 'Failed to load categories', 'error');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /* -------------------- Handlers -------------------- */
  const handleDelete = async (product: Product) => {
    const confirm = await Swal.fire({
      title: 'Delete Product?',
      text: `Are you sure you want to delete "${product.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        setLoading(prev => ({ ...prev, delete: true }));
        try {
          const response = await fetch(`${API_URL}/products/${product._id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });

          if (!response.ok) throw new Error('Delete failed');
          
          showToast('Deleted', 'Product deleted successfully', 'success');
          // Refresh current page
          if (filter === 'bestseller') {
            fetchBestSeller(pagination.page);
          } else if (selectedCategory) {
            fetchByCategory(selectedCategory, pagination.page);
          } else {
            fetchProducts(pagination.page);
          }
        } catch {
          showToast('Error', 'Delete failed', 'error');
          throw new Error('Delete failed');
        } finally {
          setLoading(prev => ({ ...prev, delete: false }));
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (!confirm.isConfirmed) return;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setLoading(prev => ({ ...prev, submit: true }));

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Convert tags from string to array
    const tagsValue = formData.get('tags');
    if (typeof tagsValue === 'string') {
      formData.delete('tags');
      tagsValue.split(',').forEach(tag => {
        if (tag.trim()) {
          formData.append('tags', tag.trim());
        }
      });
    }

    // Convert boolean values
    formData.set('isBestSeller', formData.get('isBestSeller') === 'true' ? 'true' : 'false');
    formData.set('isFeatured', formData.get('isFeatured') === 'true' ? 'true' : 'false');
    formData.set('isNewArrival', formData.get('isNewArrival') === 'true' ? 'true' : 'false');

    try {
      const url = editingProduct
        ? `${API_URL}/products/${editingProduct._id}`
        : `${API_URL}/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Request failed');

      showToast(
        'Success',
        editingProduct ? 'Product updated' : 'Product created',
        'success'
      );

      setShowModal(false);
      setEditingProduct(null);
      // Refresh current page
      if (filter === 'bestseller') {
        fetchBestSeller(pagination.page);
      } else if (selectedCategory) {
        fetchByCategory(selectedCategory, pagination.page);
      } else {
        fetchProducts(pagination.page);
      }
    } catch {
      showToast('Error', 'Operation failed', 'error');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleView = (product: Product) => {
    fetchProductDetails(product._id);
  };

  const resetFilters = async () => {
    setLoading(prev => ({ ...prev, filter: true }));
    setStatusFilter('all');
    await fetchProducts(1, 'all');
    setLoading(prev => ({ ...prev, filter: false }));
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    if (filter === 'bestseller') {
      fetchBestSeller(page);
    } else if (selectedCategory) {
      fetchByCategory(selectedCategory, page);
    } else {
      fetchProducts(page);
    }
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    
    if (filter === 'bestseller') {
      fetchBestSeller(1, status);
    } else if (selectedCategory) {
      fetchByCategory(selectedCategory, 1, status);
    } else {
      fetchProducts(1, status);
    }
  };

  const handleFilterChange = (type: 'all' | 'bestseller') => {
    if (type === 'bestseller') {
      setFilter('bestseller');
      fetchBestSeller(1, statusFilter);
    } else {
      setFilter('all');
      fetchProducts(1, statusFilter);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId) {
      setSelectedCategory(categoryId);
      fetchByCategory(categoryId, 1, statusFilter);
    } else {
      resetFilters();
    }
  };

  /* -------------------- Table -------------------- */
  const columns = [
    { 
      key: 'images', 
      label: 'Image',
      render: (images: ProductImage[]) => (
        images && images.length > 0 ? (
          <img 
            src={images[0].url} 
            alt={images[0].alt || 'Product'} 
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500">No image</span>
          </div>
        )
      )
    },
    { key: 'name', label: 'Product' },
    { 
      key: 'category', 
      label: 'Category',
      render: (category: Product['category']) => category?.name || 'N/A'
    },
    { 
      key: 'price', 
      label: 'Price',
      render: (price: number) => `Rs. ${price.toFixed(2)}`
    },
    {
      key: 'isBestSeller',
      label: 'Best Seller',
      render: (isBestSeller: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs ${isBestSeller ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
          {isBestSeller ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
  ];

  // Local search filtering (after paginated data is loaded)
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  /* -------------------- Pagination Component -------------------- */
  const PaginationFooter = () => {
    const { page, totalPages, total, limit } = pagination;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
      <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading.products}
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
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading.products}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === pageNum
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading.products}
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

  /* -------------------- JSX -------------------- */
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-[#4B5563]">Products</h1>
        <Button 
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          disabled={loading.categories || loading.products}
        >
          {loading.categories ? (
            <>
              <span className="animate-spin mr-2">⟳</span> Loading...
            </>
          ) : (
            <>
              <Plus size={18} className="mr-2" /> Add Product
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          onClick={() => handleFilterChange('all')}
          disabled={loading.filter || loading.products}
        >
          {loading.filter && filter === 'all' ? (
            <span className="animate-spin mr-2">⟳</span>
          ) : null}
          All
        </Button>

        <Button
          variant={filter === 'bestseller' ? 'primary' : 'ghost'}
          onClick={() => handleFilterChange('bestseller')}
          disabled={loading.filter || loading.products}
        >
          {loading.filter && filter === 'bestseller' ? (
            <span className="animate-spin mr-2">⟳</span>
          ) : null}
          Best Seller
        </Button>

        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border px-3 py-2 rounded-lg"
          disabled={loading.categories || loading.filter}
        >
          <option value="">Filter by Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
          className="border px-3 py-2 rounded-lg"
          disabled={loading.filter || loading.products}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {(selectedCategory || filter !== 'all' || statusFilter !== 'all') && (
          <Button 
            variant="ghost" 
            onClick={resetFilters}
            disabled={loading.filter}
          >
            {loading.filter ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : null}
            Clear Filters
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, description, category or tags..."
            className="pl-10 w-full border p-2 rounded-lg"
            disabled={loading.products}
          />
        </div>

        {loading.products ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={filteredProducts}
                onView={(p) => handleView(p as Product)}
                onEdit={(p) => handleEdit(p as Product)}
                onDelete={(p) => handleDelete(p as Product)}
                loading={loading.delete}
              />
            </div>
            
            {/* Pagination */}
            {pagination.total > 0 && (
              <PaginationFooter />
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                name="name" 
                label="Product Name" 
                defaultValue={editingProduct?.name}
                required
                disabled={loading.submit}
              />
              
              <Input
                name="price"
                type="number"
                label="Price"
                defaultValue={editingProduct?.price}
                min="0"
                step="0.01"
                required
                disabled={loading.submit}
              />
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description}
                  className="w-full border p-2 rounded min-h-[100px]"
                  required
                  disabled={loading.submit}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select 
                  name="category" 
                  className="w-full border p-2 rounded"
                  defaultValue={editingProduct?.category?._id}
                  required
                  disabled={loading.submit || loading.categories}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Input
                name="tags"
                label="Tags (comma separated)"
                defaultValue={editingProduct?.tags?.join(', ')}
                placeholder="handmade, jewelry, gift"
                disabled={loading.submit}
              />
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select 
                  name="status" 
                  className="w-full border p-2 rounded"
                  defaultValue={editingProduct?.status || 'active'}
                  disabled={loading.submit}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isBestSeller"
                  id="isBestSeller"
                  defaultChecked={editingProduct?.isBestSeller || false}
                  value="true"
                  className="w-4 h-4"
                  disabled={loading.submit}
                />
                <label htmlFor="isBestSeller" className="text-sm">
                  Best Seller
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  id="isFeatured"
                  defaultChecked={editingProduct?.isFeatured || false}
                  value="true"
                  className="w-4 h-4"
                  disabled={loading.submit}
                />
                <label htmlFor="isFeatured" className="text-sm">
                  Featured
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isNewArrival"
                  id="isNewArrival"
                  defaultChecked={editingProduct?.isNewArrival || false}
                  value="true"
                  className="w-4 h-4"
                  disabled={loading.submit}
                />
                <label htmlFor="isNewArrival" className="text-sm">
                  New Arrival
                </label>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Images
                </label>
                <input 
                  type="file" 
                  name="images" 
                  multiple 
                  className="w-full border p-2 rounded"
                  accept="image/*"
                  disabled={loading.submit}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingProduct ? 'Select new images to add to existing ones' : 'Select one or more images'}
                </p>
              </div>
            </div>

            {/* Show existing images when editing */}
            {editingProduct?.images && editingProduct.images.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Current Images
                </label>
                <div className="flex gap-2 flex-wrap">
                  {editingProduct.images.map((img) => (
                    <img 
                      key={img._id} 
                      src={img.url} 
                      alt={img.alt}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading.submit}
              >
                {loading.submit ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    {editingProduct ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingProduct ? 'Update Product' : 'Create Product'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1"
                disabled={loading.submit}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{viewingProduct.name}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={loading.view}
              >
                ✕
              </button>
            </div>

            {loading.view ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading product details...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    <h3 className="font-semibold mb-2">Images</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {viewingProduct.images.map((img) => (
                        <img 
                          key={img._id} 
                          src={img.url} 
                          alt={img.alt}
                          className="w-full h-48 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Description</h3>
                      <p>{viewingProduct.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-1">Category</h3>
                        <p>{viewingProduct.category?.name}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Price</h3>
                        <p className="font-bold">RS. {viewingProduct.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Status</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          viewingProduct.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {viewingProduct.status.charAt(0).toUpperCase() + viewingProduct.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Slug</h3>
                        <p className="text-sm">{viewingProduct.slug}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-1">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProduct.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold mb-1">Best Seller</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${viewingProduct.isBestSeller ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {viewingProduct.isBestSeller ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Featured</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${viewingProduct.isFeatured ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {viewingProduct.isFeatured ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">New Arrival</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${viewingProduct.isNewArrival ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {viewingProduct.isNewArrival ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-1">Created At</h3>
                      <p>{new Date(viewingProduct.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(viewingProduct);
                    }}
                    className="flex-1"
                  >
                    Edit Product
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowViewModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}