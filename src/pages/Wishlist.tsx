import { Search } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Wishlist() {
  const [searchQuery, setSearchQuery] = useState('');

  const wishlistItems = [
    { id: 1, user: 'John Doe', product: 'Ceramic Vase', price: '$45.00', addedOn: '2024-01-15', inStock: true },
    { id: 2, user: 'Jane Smith', product: 'Abstract Sculpture', price: '$120.00', addedOn: '2024-01-14', inStock: true },
    { id: 3, user: 'Bob Johnson', product: 'Decorative Bowl', price: '$32.00', addedOn: '2024-01-13', inStock: false },
    { id: 4, user: 'Alice Brown', product: 'Wall Art Piece', price: '$65.00', addedOn: '2024-01-12', inStock: true },
  ];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'User' },
    { key: 'product', label: 'Product' },
    { key: 'price', label: 'Price' },
    { key: 'addedOn', label: 'Added On' },
    {
      key: 'inStock',
      label: 'Availability',
      render: (value: unknown) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
        }`}>
          {value ? 'In Stock' : 'Out of Stock'}
        </span>
      ),
    },
  ];

  const handleView = (item: Record<string, unknown>) => {
    console.log('View wishlist item:', item);
  };

  const handleDelete = (item: Record<string, unknown>) => {
    if (confirm('Remove this item from wishlist?')) {
      console.log('Delete wishlist item:', item);
    }
  };

  const filteredItems = wishlistItems.filter(item =>
    item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#4B5563]">Wishlist Items</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search wishlist items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredItems}
          onView={handleView}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
