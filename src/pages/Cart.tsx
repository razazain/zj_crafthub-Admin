import { Search } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Cart() {
  const [searchQuery, setSearchQuery] = useState('');

  const cartItems = [
    { id: 1, user: 'John Doe', product: 'Ceramic Vase', quantity: 2, price: '$45.00', total: '$90.00', addedOn: '2024-01-15' },
    { id: 2, user: 'Jane Smith', product: 'Clay Pot', quantity: 1, price: '$28.00', total: '$28.00', addedOn: '2024-01-16' },
    { id: 3, user: 'Bob Johnson', product: 'Sculpture', quantity: 1, price: '$120.00', total: '$120.00', addedOn: '2024-01-17' },
  ];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'User' },
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'price', label: 'Unit Price' },
    { key: 'total', label: 'Total' },
    { key: 'addedOn', label: 'Added On' },
  ];

  const handleDelete = (item: Record<string, unknown>) => {
    if (confirm('Remove this item from cart?')) {
      console.log('Delete cart item:', item);
    }
  };

  const filteredItems = cartItems.filter(item =>
    item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#4B5563]">Cart Items</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search cart items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredItems}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
