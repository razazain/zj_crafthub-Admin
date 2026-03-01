import { Menu, LogOut, User } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Navbar({ onMenuClick, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu size={24} />
        </button>

        {/* Right Section */}
        <div className="flex items-center space-x-4 ml-auto">
          <div className="flex items-center space-x-2 text-gray-700">
            <User size={20} />
            <span className="text-sm font-medium">Admin</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-[#D0A19B] rounded-lg hover:bg-[#C09189] transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
