import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  FileText,
  Users,
  Mail,
  Heart,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Menu Items organized for best UX
const menuItems = {
  sales: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Orders', icon: FileText },
    { path: '/cart', label: 'Cart', icon: ShoppingCart },
    { path: '/wishlist', label: 'Wishlist', icon: Heart },
  ],
  management: [
    { path: '/products', label: 'Products', icon: Package },
    { path: '/categories', label: 'Categories', icon: FolderTree },
    { path: '/users', label: 'All Users', icon: Users },
    { path: '/leads', label: 'All Leads', icon: Mail },
  ],
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#4B5563]">ZJ Craft Hub</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            {/* Sales Section */}
            <div className="px-6 mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Sales
              </span>
              <div className="mt-2 space-y-1">
                {menuItems.sales.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 transition-colors rounded-r-md
                        ${
                          isActive
                            ? 'bg-[#F6DFD7] text-[#D0A19B] border-r-4 border-[#D0A19B]'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Management Section */}
            <div className="px-6">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Management
              </span>
              <div className="mt-2 space-y-1">
                {menuItems.management.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 transition-colors rounded-r-md
                        ${
                          isActive
                            ? 'bg-[#F6DFD7] text-[#D0A19B] border-r-4 border-[#D0A19B]'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}