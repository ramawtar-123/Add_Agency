import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, LayoutDashboard, Users, Briefcase, UserCircle, FileText, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/clients", label: "Clients", icon: Users },
    { path: "/projects", label: "Projects", icon: Briefcase },
    { path: "/team", label: "Team", icon: UserCircle },
    { path: "/invoices", label: "Invoices", icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r" style={{ background: 'linear-gradient(180deg, #f8fafa 0%, #eef5f5 100%)' }}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#2c5557' }}>Agency Hub</h2>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-gray-600 hover:bg-white/50"
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' } : {}}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg mb-2" style={{ background: '#e8f4f5' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#4a7c7e', color: 'white' }}>
              {user.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: '#2c5557' }}>{user.username}</p>
              <p className="text-xs" style={{ color: '#5a7879' }}>{user.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-xl" style={{ background: 'linear-gradient(180deg, #f8fafa 0%, #eef5f5 100%)' }}>
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-bold text-lg" style={{ color: '#2c5557' }}>Agency Hub</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 hover:bg-white/50"
                    }`}
                    style={isActive ? { background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <div className="flex items-center gap-3 p-3 rounded-lg mb-2" style={{ background: '#e8f4f5' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#4a7c7e', color: 'white' }}>
                  {user.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: '#2c5557' }}>{user.username}</p>
                  <p className="text-xs" style={{ color: '#5a7879' }}>{user.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden border-b bg-white p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" style={{ color: '#4a7c7e' }} />
            <h2 className="font-bold" style={{ color: '#2c5557' }}>Agency Hub</h2>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}