import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUser, FaEnvelope, FaLock, FaUserShield, FaUserPlus } from "react-icons/fa";

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", companyName: "", role: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(register(formData)).unwrap();
      Swal.fire("Success", "Account created successfully!", "success").then(() => {
        // Navigate based on role name
        if (result.role?.name === 'Admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/member-dashboard');
        }
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Registration failed";
      Swal.fire("Error", message, "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <FaUserPlus className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Join Us</h1>
          <p className="text-white/80">Create your account and get started</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="space-y-6">
            {/* Name Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-white/60" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                required
              />
            </div>

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

            {/* Company Name Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUserShield className="text-white/60" />
              </div>
              <input
                type="text"
                name="companyName"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                required
              />
            </div>

            {/* Role Select */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUserShield className="text-white/60" />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 appearance-none"
                required
              >
                <option value="" disabled className="text-gray-600">Select Role</option>
                <option value="admin" className="text-gray-600">Admin</option>
                <option value="manager" className="text-gray-600">Manager</option>
                <option value="team member" className="text-gray-600">Team Member</option>
              </select>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              className="w-full bg-white text-emerald-600 py-3 rounded-lg font-semibold hover:bg-white/90 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Create Account
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-white font-semibold hover:text-white/80 underline decoration-2 underline-offset-2 transition-all duration-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">Join our community today</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
