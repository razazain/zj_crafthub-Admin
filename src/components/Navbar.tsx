import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { API_URL } from '../config';
import { getToken } from '../utils/auth';

interface NavbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  profileImage?: {
    url: string;
    alt: string;
  };
  isVerified?: boolean;
}

export default function Navbar({ onMenuClick, onLogout }: NavbarProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return 'A';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name (first name or full name)
  const getDisplayName = () => {
    if (!user?.name) return 'Admin';
    const firstName = user.name.split(' ')[0];
    return firstName;
  };

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
          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              {/* Profile Image or Initials */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#D0A19B] bg-opacity-20 flex items-center justify-center">
                {!loading && user?.profileImage?.url && !imageError ? (
                  <img 
                    src={user.profileImage.url} 
                    alt={user.profileImage.alt || user.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-sm font-medium text-[#D0A19B]">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              
              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {loading ? 'Loading...' : getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {loading ? '' : user?.role || 'Admin'}
                </p>
              </div>

              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                {/* <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // You can add profile navigation here if needed
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button> */}
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout Button (visible on mobile only) */}
          <button
            onClick={onLogout}
            className="sm:hidden flex items-center justify-center w-10 h-10 text-white bg-[#D0A19B] rounded-lg hover:bg-[#C09189] transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}