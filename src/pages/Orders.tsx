import { Search } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');

  const orders = [
    { id: '#ORD-001', customer: 'John Doe', product: 'Ceramic Vase', total: '$90.00', status: 'Completed', date: '2024-01-10' },
    { id: '#ORD-002', customer: 'Jane Smith', product: 'Clay Pot', total: '$28.00', status: 'Pending', date: '2024-01-12' },
    { id: '#ORD-003', customer: 'Bob Johnson', product: 'Sculpture', total: '$120.00', status: 'Processing', date: '2024-01-14' },
    { id: '#ORD-004', customer: 'Alice Brown', product: 'Decorative Bowl', total: '$32.00', status: 'Completed', date: '2024-01-15' },
    { id: '#ORD-005', customer: 'Charlie Wilson', product: 'Wall Art', total: '$65.00', status: 'Shipped', date: '2024-01-16' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Processing': return 'text-blue-600 bg-blue-100';
      case 'Shipped': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Product' },
    { key: 'total', label: 'Total Amount' },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(String(value))}`}>
          {String(value)}
        </span>
      ),
    },
    { key: 'date', label: 'Order Date' },
  ];

  const handleView = (order: Record<string, unknown>) => {
    console.log('View order:', order);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredOrders}
          onView={handleView}
        />
      </Card>
    </div>
  );
}
