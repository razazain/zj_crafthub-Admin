import { useState } from 'react';
import { LogIn, Eye, EyeOff, ExternalLink } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ Role check
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin only.');
      }

      // ✅ Secure token storage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      // ✅ Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        text: `Successfully logged in as ${data.user.name}`,
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'bottom-end',
      });

      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message);
      // Show error toast
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message,
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6DFD7] to-[#D0A19B] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D0A19B] rounded-full mb-4 animate-pulse">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#4B5563]">ZJ Craft Hub</h1>
          <p className="text-gray-600 mt-2">Admin Panel Login</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            placeholder="admin@zjcrafthub.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="transition-all duration-200 focus:scale-[1.02]"
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="transition-all duration-200 focus:scale-[1.02] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-500 hover:text-[#D0A19B] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full relative overflow-hidden transition-all duration-200 hover:scale-[1.02]" 
            size="lg" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-3">
          <a 
            href="/forgot-password" 
            className="text-sm text-[#D0A19B] hover:text-[#C09189] transition-colors hover:underline"
          >
            Forgot your password?
          </a>
          
          <div className="w-full border-t border-gray-200 my-2"></div>
          
          <a 
            href="https://zjcrafthub.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D0A19B] transition-all duration-200 hover:scale-105 group"
          >
            <span>Visit ZJ Craft Hub Website</span>
            <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}