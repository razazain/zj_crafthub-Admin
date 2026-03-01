import { Search } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');

  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', orders: 5, joined: '2023-12-01', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', orders: 3, joined: '2023-12-05', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892', orders: 8, joined: '2023-11-20', status: 'Active' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+1234567893', orders: 2, joined: '2024-01-02', status: 'Active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '+1234567894', orders: 6, joined: '2023-12-15', status: 'Inactive' },
  ];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'orders', label: 'Total Orders' },
    { key: 'joined', label: 'Joined Date' },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
        }`}>
          {String(value)}
        </span>
      ),
    },
  ];

  const handleView = (user: Record<string, unknown>) => {
    console.log('View user:', user);
  };

  const handleEdit = (user: Record<string, unknown>) => {
    console.log('Edit user:', user);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#4B5563]">All Users</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredUsers}
          onView={handleView}
          onEdit={handleEdit}
        />
      </Card>
    </div>
  );
}
