import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUser, FaEnvelope, FaLock, FaUserShield, FaUserPlus, FaCheckCircle, FaSpinner } from "react-icons/fa";
import AuthIllustration from "../components/AuthIllustration";

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", companyName: "", role: "" });
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
      const message = error.payload || error.message || "Registration failed";
      Swal.fire("Error", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-signup min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="auth-layout auth-layout-signup">
        <div className="auth-form-column">
          <div className="auth-heading">
            <div className="auth-heading-icon"><FaUserPlus /></div>
            <h1>Create your account</h1>
            <p>Set up your workspace and bring your team together</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="auth-submit w-full bg-white text-emerald-600 py-3 rounded-lg font-semibold hover:bg-white/90 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {isSubmitting ? (
                <><FaSpinner className="mr-2 inline-block animate-spin" aria-hidden="true" />Creating account…</>
              ) : "Create Account"}
            </button>
          </div>

          <div className="auth-form-footer">
            <p>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
          </form>
        </div>

        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-visual-brand">ProManage<span>.</span></div>
          <div className="auth-visual-copy">
            <span className="auth-visual-eyebrow">MAKE WORK FLOW</span>
            <h2>Big things start with a team.</h2>
            <p>Bring projects, people, and progress together in one place.</p>
          </div>
          <div className="auth-artwork">
            <div className="auth-artwork-orbit"></div>
            <AuthIllustration />
            <div className="auth-artwork-badge"><FaCheckCircle /><span>Team workspace</span></div>
          </div>
          <div className="auth-visual-caption">A clearer way to plan, collaborate, and deliver.</div>
        </aside>
      </div>
    </div>
  );
};

export default Signup;
