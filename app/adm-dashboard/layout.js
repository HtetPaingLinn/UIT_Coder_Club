import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "UIT Coding Club - Admin Dashboard",
};

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="admin-dashboard-layout w-full ">
      <AuthProvider>
        {children}
      </AuthProvider>
    </div>
  );
} 