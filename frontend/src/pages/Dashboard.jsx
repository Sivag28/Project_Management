
import { useSelector } from "react-redux";
import AdminDashboard from "./AdminDashboard";
import MemberDashboard from "./MemberDashboard";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role?.name === "Admin" || user?.role?.name === "Manager") {
    return <AdminDashboard />;
  } else {
    return <MemberDashboard />;
  }
};

export default Dashboard;
