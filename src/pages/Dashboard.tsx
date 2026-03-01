import { Package, FileText, Users, Mail, TrendingUp, ShoppingCart } from 'lucide-react';
import StatCard from '../components/StatCard';
import Card from '../components/Card';

export default function Dashboard() {
  const stats = [
    { title: 'Total Products', value: '156', icon: Package, trend: '+12% from last month', color: '#D0A19B' },
    { title: 'Total Orders', value: '89', icon: FileText, trend: '+8% from last month', color: '#4B5563' },
    { title: 'Registered Users', value: '342', icon: Users, trend: '+23% from last month', color: '#D0A19B' },
    { title: 'New Leads', value: '45', icon: Mail, trend: '+15% from last month', color: '#4B5563' },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'John Doe', product: 'Handmade Vase', amount: '$45.00', status: 'Completed' },
    { id: '#ORD-002', customer: 'Jane Smith', product: 'Ceramic Bowl', amount: '$32.00', status: 'Pending' },
    { id: '#ORD-003', customer: 'Bob Johnson', product: 'Clay Sculpture', amount: '$78.00', status: 'Processing' },
    { id: '#ORD-004', customer: 'Alice Brown', product: 'Decorative Plate', amount: '$25.00', status: 'Completed' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#4B5563]">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>Overview</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Orders">
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#4B5563]">{order.id}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{order.customer}</p>
                  <p className="text-sm text-gray-500">{order.product}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#D0A19B]">{order.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group">
              <Package size={32} className="mb-2 text-[#D0A19B] group-hover:text-white" />
              <span className="font-medium text-[#4B5563] group-hover:text-white">Add Product</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group">
              <ShoppingCart size={32} className="mb-2 text-[#D0A19B] group-hover:text-white" />
              <span className="font-medium text-[#4B5563] group-hover:text-white">View Orders</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group">
              <Users size={32} className="mb-2 text-[#D0A19B] group-hover:text-white" />
              <span className="font-medium text-[#4B5563] group-hover:text-white">Manage Users</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-[#F6DFD7] rounded-lg hover:bg-[#D0A19B] hover:text-white transition-colors group">
              <Mail size={32} className="mb-2 text-[#D0A19B] group-hover:text-white" />
              <span className="font-medium text-[#4B5563] group-hover:text-white">View Leads</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
