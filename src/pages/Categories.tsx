import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import { API_URL } from '../config';
import { getToken } from '../utils/auth';
import Swal from 'sweetalert2';

interface Category {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  images?: {
    url: string;
    alt: string;
    _id: string;
  }[];
}

/* ================= TOAST ================= */
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

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===== FILTERS ===== */
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [limit, setLimit] = useState(5);

  /* ===== PAGINATION ===== */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  /* ===== MODAL ===== */
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    image: null as File | null,
  });

  /* ================= FETCH ================= */
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`${API_URL}/categories?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCategories(data.categories);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      showToast('Error', 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, limit, statusFilter]);

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async () => {
    const token = getToken();
    if (!token) {
      showToast('Unauthorized', 'Please login again', 'warning');
      return;
    }

    const body = new FormData();
    body.append('name', formData.name);
    body.append('description', formData.description);
    body.append('status', formData.status);
    if (formData.image) body.append('image', formData.image);

    const url = editingCategory
      ? `${API_URL}/categories/${editingCategory._id}`
      : `${API_URL}/categories`;

    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(
        'Success',
        editingCategory ? 'Category updated successfully' : 'Category created successfully',
        'success'
      )
        
      
      
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
      setTimeout(() => {
      window.location.reload();
    }, 5000);
    } catch (err: any) {
      showToast('Error', err.message || 'Action failed', 'error');
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (row: Record<string, unknown>) => {
    const category = row as Category;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete "${category.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    const token = getToken();
    try {
      await fetch(`${API_URL}/categories/${category._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast('Deleted', 'Category deleted successfully', 'success');
      fetchCategories();
    } catch {
      showToast('Error', 'Delete failed', 'error');
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (row: Record<string, unknown>) => {
    const category = row as Category;
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
      image: null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      image: null,
    });
  };

  /* ================= TABLE ================= */
  const columns = [
    {
      key: 'images',
      label: 'Image',
      render: (_: unknown, row?: Record<string, unknown>) => {
        const category = row as Category;
        return category.images?.[0]?.url ? (
          <img
            src={category.images[0].url}
            alt={category.images[0].alt}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <span className="text-gray-400 text-sm">No Image</span>
        );
      },
    },
    { key: 'name', label: 'Category Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${value === 'active'
              ? 'text-green-600 bg-green-100'
              : 'text-gray-600 bg-gray-100'
            }`}
        >
          {String(value)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-[#4B5563]">Categories</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} className="mr-2" /> Add Category
        </Button>
      </div>

      {/* FILTERS */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => { setPage(1); setStatusFilter(e.target.value as any); }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={limit}
            onChange={e => { setPage(1); setLimit(Number(e.target.value)); }}
            className="border rounded-lg px-3 py-2"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </Card>

      {/* TABLE */}
      <Card>
        <Table
          columns={columns}
          data={categories.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages} • Total {total}
          </p>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* MODAL (UNCHANGED, ALREADY PERFECT) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>

            <div className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <textarea
                className="w-full border rounded-lg p-2"
                rows={3}
                placeholder="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />

              <select
                value={formData.status}
                onChange={e =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {editingCategory?.images?.[0]?.url && (
                <img
                  src={editingCategory.images[0].url}
                  className="w-32 h-32 mx-auto rounded object-cover"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={e =>
                  setFormData({ ...formData, image: e.target.files?.[0] || null })
                }
              />

              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handleSubmit}>
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
