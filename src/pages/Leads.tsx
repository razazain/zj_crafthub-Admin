import { Search } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState('');

  const leads = [
    { id: 1, name: 'Michael Scott', email: 'michael@example.com', phone: '+1234567890', message: 'Interested in bulk order', date: '2024-01-18', status: 'New' },
    { id: 2, name: 'Pam Beesly', email: 'pam@example.com', phone: '+1234567891', message: 'Question about custom designs', date: '2024-01-17', status: 'Contacted' },
    { id: 3, name: 'Jim Halpert', email: 'jim@example.com', phone: '+1234567892', message: 'Corporate gifts inquiry', date: '2024-01-16', status: 'Converted' },
    { id: 4, name: 'Dwight Schrute', email: 'dwight@example.com', phone: '+1234567893', message: 'Wholesale pricing request', date: '2024-01-15', status: 'New' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'text-blue-600 bg-blue-100';
      case 'Contacted': return 'text-yellow-600 bg-yellow-100';
      case 'Converted': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'message', label: 'Message' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(String(value))}`}>
          {String(value)}
        </span>
      ),
    },
  ];

  const handleView = (lead: Record<string, unknown>) => {
    console.log('View lead:', lead);
  };

  const handleDelete = (lead: Record<string, unknown>) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      console.log('Delete lead:', lead);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#4B5563]">All Leads</h1>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredLeads}
          onView={handleView}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
