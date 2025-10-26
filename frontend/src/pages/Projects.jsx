import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, DollarSign, Edit, Trash2, Briefcase } from "lucide-react";
import { api } from "@/App";
import { toast } from "sonner";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active",
    budget: "",
    team_members: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes, teamRes] = await Promise.all([
        api.get("/projects"),
        api.get("/clients"),
        api.get("/team")
      ]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
      setTeamMembers(teamRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };
      
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, submitData);
        toast.success("Project updated successfully");
      } else {
        await api.post("/projects", submitData);
        toast.success("Project created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success("Project deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client_id: project.client_id,
      description: project.description || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status,
      budget: project.budget?.toString() || "",
      team_members: project.team_members || []
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      client_id: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "active",
      budget: "",
      team_members: []
    });
    setEditingProject(null);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "completed": return "bg-blue-100 text-blue-700";
      case "on_hold": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#2c5557' }}>Projects</h1>
            <p className="text-base" style={{ color: '#5a7879' }}>Track and manage your projects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }} data-testid="add-project-button">
                <Plus className="w-4 h-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
                <DialogDescription>
                  {editingProject ? "Update project information" : "Fill in the details to create a new project"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    data-testid="project-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
                    <SelectTrigger data-testid="project-client-select">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="project-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      data-testid="project-start-date-input"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      data-testid="project-end-date-input"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      data-testid="project-budget-input"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger data-testid="project-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="project-submit-button" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }}>
                    {editingProject ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="shadow-md border-0">
            <CardContent className="py-16 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4" style={{ color: '#4a7c7e', opacity: 0.5 }} />
              <p className="text-lg mb-2" style={{ color: '#2c5557' }}>No projects yet</p>
              <p style={{ color: '#5a7879' }}>Create your first project to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-list">
            {projects.map((project) => (
              <Card key={project.id} className="card-hover shadow-md border-0" data-testid={`project-card-${project.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl flex-1" style={{ color: '#2c5557' }}>{project.name}</CardTitle>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`} data-testid={`project-status-${project.id}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#5a7879' }}>{getClientName(project.client_id)}</p>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: '#5a7879' }}>{project.description}</p>
                  )}
                  <div className="space-y-2 mb-4">
                    {project.start_date && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#5a7879' }}>
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#5a7879' }}>
                        <DollarSign className="w-4 h-4" />
                        <span>${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(project)}
                      data-testid={`edit-project-${project.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(project.id)}
                      data-testid={`delete-project-${project.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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