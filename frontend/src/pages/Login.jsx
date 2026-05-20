import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import Swal from "sweetalert2";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(login(formData)).unwrap();
      console.log('Login result:', result);
      console.log('User role:', result.role);
      console.log('User permissions:', result.role?.permissions);
      console.log('Role name:', result.role?.name);

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Welcome back!',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        // Navigate based on role name
        if (result.role?.name === 'Admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/member-dashboard');
        }
      });
    } catch (error) {
      console.error("Login failed:", error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message || 'Invalid email or password',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-16 left-16 w-40 h-40 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute top-80 right-24 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute bottom-16 right-16 w-36 h-36 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-8 w-24 h-24 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute top-2/3 right-8 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <FaSignInAlt className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-white/60" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-white/60" />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-white/90 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Sign In
            </button>
          </div>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-white font-semibold hover:text-white/80 underline decoration-2 underline-offset-2 transition-all duration-300"
              >
                Create one here
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">Access your dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
