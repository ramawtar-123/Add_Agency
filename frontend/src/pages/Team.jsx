import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Mail } from "lucide-react";
import { api } from "@/App";
import { toast } from "sonner";

export default function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get("/team");
      setTeamMembers(response.data);
    } catch (error) {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2c5557' }}>Team</h1>
          <p className="text-base" style={{ color: '#5a7879' }}>Your agency team members</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <Card className="shadow-md border-0">
            <CardContent className="py-16 text-center">
              <UserCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#4a7c7e', opacity: 0.5 }} />
              <p className="text-lg mb-2" style={{ color: '#2c5557' }}>No team members yet</p>
              <p style={{ color: '#5a7879' }}>Team members will appear here once registered</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="team-list">
            {teamMembers.map((member) => (
              <Card key={member.id} className="card-hover shadow-md border-0" data-testid={`team-member-${member.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }}>
                      {member.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg" style={{ color: '#2c5557' }}>{member.username}</CardTitle>
                      <p className="text-xs capitalize" style={{ color: '#5a7879' }}>{member.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#5a7879' }}>
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}