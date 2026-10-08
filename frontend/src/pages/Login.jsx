import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt, FaCheckCircle, FaSpinner } from "react-icons/fa";
import AuthIllustration from "../components/AuthIllustration";
import Swal from "sweetalert2";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-login min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="auth-layout auth-layout-login">
        <div className="auth-form-column">
          <div className="auth-heading">
            <div className="auth-heading-icon"><FaSignInAlt /></div>
            <h1>Welcome back</h1>
            <p>Sign in to your ProManage workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="auth-submit w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-white/90 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {isSubmitting ? (
                <><FaSpinner className="mr-2 inline-block animate-spin" aria-hidden="true" />Signing in…</>
              ) : "Sign In"}
            </button>
          </div>

          <div className="auth-form-footer">
            <p>
              New to ProManage?{" "}
              <Link
                to="/signup"
                className="font-semibold"
              >
                Create an account
              </Link>
            </p>
          </div>
          </form>
        </div>

        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-visual-brand">ProManage<span>.</span></div>
          <div className="auth-visual-copy">
            <span className="auth-visual-eyebrow">YOUR WORKSPACE, IN SYNC</span>
            <h2>Good to have you back.</h2>
            <p>Pick up where your team left off and keep great work moving.</p>
          </div>
          <div className="auth-artwork">
            <div className="auth-artwork-orbit"></div>
            <AuthIllustration />
            <div className="auth-artwork-badge"><FaCheckCircle /><span>On track</span></div>
          </div>
          <div className="auth-visual-caption">Everything your team needs to do its best work.</div>
        </aside>
      </div>
    </div>
  );
};

export default Login;
