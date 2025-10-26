import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, DollarSign, Edit, Trash2, FileText, Minus } from "lucide-react";
import { api } from "@/App";
import { toast } from "sonner";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    amount: "",
    status: "pending",
    due_date: "",
    items: [],
    notes: ""
  });
  const [currentItem, setCurrentItem] = useState({
    description: "",
    quantity: 1,
    rate: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, clientsRes, projectsRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/clients"),
        api.get("/projects")
      ]);
      setInvoices(invoicesRes.data);
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!currentItem.description || !currentItem.rate) {
      toast.error("Please fill in description and rate");
      return;
    }
    const amount = currentItem.quantity * parseFloat(currentItem.rate);
    const newItem = {
      description: currentItem.description,
      quantity: parseInt(currentItem.quantity),
      rate: parseFloat(currentItem.rate),
      amount: amount
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
    setCurrentItem({ description: "", quantity: 1, rate: "" });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = calculateTotal();
      const submitData = {
        ...formData,
        amount: total,
        project_id: formData.project_id === "none" ? null : formData.project_id || null
      };
      
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}`, submitData);
        toast.success("Invoice updated successfully");
      } else {
        await api.post("/invoices", submitData);
        toast.success("Invoice created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success("Invoice deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_id: invoice.client_id,
      project_id: invoice.project_id || "none",
      amount: invoice.amount.toString(),
      status: invoice.status,
      due_date: invoice.due_date,
      items: invoice.items || [],
      notes: invoice.notes || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      project_id: "",
      amount: "",
      status: "pending",
      due_date: "",
      items: [],
      notes: ""
    });
    setCurrentItem({ description: "", quantity: 1, rate: "" });
    setEditingInvoice(null);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#2c5557' }}>Invoices</h1>
            <p className="text-base" style={{ color: '#5a7879' }}>Manage your billing and invoices</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }} data-testid="add-invoice-button">
                <Plus className="w-4 h-4" /> Add Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
                <DialogDescription>
                  {editingInvoice ? "Update invoice information" : "Fill in the details to create a new invoice"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
                      <SelectTrigger data-testid="invoice-client-select">
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
                    <Label htmlFor="project">Project (Optional)</Label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                      <SelectTrigger data-testid="invoice-project-select">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.filter(p => p.client_id === formData.client_id).map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      data-testid="invoice-due-date-input"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger data-testid="invoice-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Invoice Items</Label>
                  <div className="border rounded-lg p-4 space-y-3" style={{ background: '#f8fafa' }}>
                    <div className="grid grid-cols-12 gap-2">
                      <Input
                        placeholder="Description"
                        className="col-span-5"
                        data-testid="invoice-item-description-input"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="col-span-2"
                        data-testid="invoice-item-quantity-input"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                        min="1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Rate"
                        className="col-span-3"
                        data-testid="invoice-item-rate-input"
                        value={currentItem.rate}
                        onChange={(e) => setCurrentItem({ ...currentItem, rate: e.target.value })}
                      />
                      <Button type="button" onClick={addItem} className="col-span-2" size="sm" data-testid="add-invoice-item-button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {formData.items.length > 0 && (
                      <div className="space-y-2" data-testid="invoice-items-list">
                        {formData.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.description}</p>
                              <p className="text-xs" style={{ color: '#5a7879' }}>
                                {item.quantity} × ${item.rate.toFixed(2)} = ${item.amount.toFixed(2)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => removeItem(index)}
                              data-testid={`remove-invoice-item-${index}`}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex justify-end pt-2 border-t">
                          <p className="text-lg font-bold" style={{ color: '#2c5557' }}>
                            Total: ${calculateTotal().toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    data-testid="invoice-notes-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={formData.items.length === 0} data-testid="invoice-submit-button" style={{ background: 'linear-gradient(135deg, #4a7c7e 0%, #6b9b9e 100%)' }}>
                    {editingInvoice ? "Update" : "Create"}
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
        ) : invoices.length === 0 ? (
          <Card className="shadow-md border-0">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#4a7c7e', opacity: 0.5 }} />
              <p className="text-lg mb-2" style={{ color: '#2c5557' }}>No invoices yet</p>
              <p style={{ color: '#5a7879' }}>Create your first invoice to start billing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="invoices-list">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="card-hover shadow-md border-0" data-testid={`invoice-card-${invoice.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1" style={{ color: '#2c5557' }}>{invoice.invoice_number}</CardTitle>
                      <p className="text-sm" style={{ color: '#5a7879' }}>{getClientName(invoice.client_id)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`} data-testid={`invoice-status-${invoice.id}`}>
                      {invoice.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#5a7879' }}>Amount:</span>
                      <span className="text-xl font-bold" style={{ color: '#4a7c7e' }}>${invoice.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#5a7879' }}>
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(invoice)}
                      data-testid={`edit-invoice-${invoice.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(invoice.id)}
                      data-testid={`delete-invoice-${invoice.id}`}
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