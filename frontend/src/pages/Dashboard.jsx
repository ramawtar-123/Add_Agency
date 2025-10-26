import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, FileText } from "lucide-react";
import { api } from "@/App";
import { toast } from "sonner";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_clients: 0,
    active_projects: 0,
    total_revenue: 0,
    pending_invoices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Clients",
      value: stats.total_clients,
      icon: Users,
      color: "#4a7c7e",
      bgColor: "#e8f4f5"
    },
    {
      title: "Active Projects",
      value: stats.active_projects,
      icon: Briefcase,
      color: "#6b9b9e",
      bgColor: "#d5e8e9"
    },
    {
      title: "Total Revenue",
      value: `$${stats.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "#5a9fa1",
      bgColor: "#c9dfe0"
    },
    {
      title: "Pending Invoices",
      value: stats.pending_invoices,
      icon: FileText,
      color: "#7aabad",
      bgColor: "#bdd5d6"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2c5557' }}>Dashboard</h1>
          <p className="text-base" style={{ color: '#5a7879' }}>Welcome back! Here's your agency overview</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="card-hover border-0 shadow-md"
                  style={{ background: stat.bgColor }}
                  data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium" style={{ color: '#5a7879' }}>
                        {stat.title}
                      </CardTitle>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: stat.color }}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" style={{ color: stat.color }} data-testid={`stat-value-${stat.title.toLowerCase().replace(' ', '-')}`}>
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle style={{ color: '#2c5557' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/clients" className="p-4 rounded-lg text-center hover:shadow-md transition-shadow" style={{ background: '#e8f4f5' }}>
                <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#4a7c7e' }} />
                <p className="font-medium" style={{ color: '#2c5557' }}>Add Client</p>
              </a>
              <a href="/projects" className="p-4 rounded-lg text-center hover:shadow-md transition-shadow" style={{ background: '#d5e8e9' }}>
                <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: '#6b9b9e' }} />
                <p className="font-medium" style={{ color: '#2c5557' }}>New Project</p>
              </a>
              <a href="/invoices" className="p-4 rounded-lg text-center hover:shadow-md transition-shadow" style={{ background: '#c9dfe0' }}>
                <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#5a9fa1' }} />
                <p className="font-medium" style={{ color: '#2c5557' }}>Create Invoice</p>
              </a>
              <a href="/team" className="p-4 rounded-lg text-center hover:shadow-md transition-shadow" style={{ background: '#bdd5d6' }}>
                <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#7aabad' }} />
                <p className="font-medium" style={{ color: '#2c5557' }}>View Team</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}