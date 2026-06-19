"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, Shield, Plus, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  company: string | null;
  license: string | null;
  bio: string | null;
  image: string | null;
  createdAt: string;
  _count: {
    properties: number;
    receivedMessages: number;
    visits: number;
  };
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  company: string;
  license: string;
  bio: string;
}

const emptyForm: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "AGENT",
  phone: "",
  company: "",
  license: "",
  bio: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create user dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<UserFormData>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit user dialog
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserFormData>>({});
  const [updating, setUpdating] = useState(false);

  // Role change dialog
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(data.pagination);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("User deleted successfully");
        setDeleteId(null);
        fetchUsers(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error("Name, email and password are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        toast.success(`${createForm.role === "ADMIN" ? "Admin" : "Agent"} account created successfully!`);
        setShowCreateDialog(false);
        setCreateForm(emptyForm);
        fetchUsers(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
      }
    } catch {
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setUpdating(true);
    try {
      const body: any = {};
      if (editForm.name !== undefined) body.name = editForm.name;
      if (editForm.phone !== undefined) body.phone = editForm.phone;
      if (editForm.company !== undefined) body.company = editForm.company;
      if (editForm.license !== undefined) body.license = editForm.license;
      if (editForm.bio !== undefined) body.bio = editForm.bio;

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("User updated successfully");
        setEditUser(null);
        setEditForm({});
        fetchUsers(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditUser(user);
    setEditForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      company: user.company ?? "",
      license: user.license ?? "",
      bio: user.bio ?? "",
    });
  };

  const handleRoleChange = async () => {
    if (!editRoleUser) return;
    setUpdatingRole(true);
    try {
      const newRole = editRoleUser.role === "ADMIN" ? "AGENT" : "ADMIN";
      const res = await fetch(`/api/users/${editRoleUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`User role updated to ${newRole}`);
        setEditRoleUser(null);
        fetchUsers(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Failed to update user role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Users</h1>
          <p className="text-muted-foreground">
            Manage platform users and their roles
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
          style={{ backgroundColor: "#2E8B57" }}
        >
          <UserPlus className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(val) => setRoleFilter(val === "ALL" ? "" : val)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="AGENT">Agents</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.company ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user._count.properties}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-GH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditRoleUser(user)}
                            title="Toggle role"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {search || roleFilter
                  ? "No users match your filters."
                  : "No users found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchUsers(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchUsers(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Agent Account
            </DialogTitle>
            <DialogDescription>
              Create a new agent or admin account. They will be able to log in immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name">Full Name *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Kwame Asante"
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="agent@state-immocom.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-password">Password *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <Label htmlFor="create-role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(val) => setCreateForm((p) => ({ ...p, role: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-phone">Phone</Label>
                <Input
                  id="create-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <div>
                <Label htmlFor="create-company">Company</Label>
                <Input
                  id="create-company"
                  value={createForm.company}
                  onChange={(e) => setCreateForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Real Estate Co."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-license">License Number</Label>
              <Input
                id="create-license"
                value={createForm.license}
                onChange={(e) => setCreateForm((p) => ({ ...p, license: e.target.value }))}
                placeholder="REA-XXXXX"
              />
            </div>
            <div>
              <Label htmlFor="create-bio">Bio</Label>
              <Textarea
                id="create-bio"
                rows={3}
                value={createForm.bio}
                onChange={(e) => setCreateForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Brief description of the agent..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setCreateForm(emptyForm);
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              style={{ backgroundColor: "#2E8B57" }}
              className="text-white"
            >
              {creating ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => { setEditUser(null); setEditForm({}); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update information for {editUser?.name ?? editUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={editForm.company ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-license">License Number</Label>
              <Input
                id="edit-license"
                value={editForm.license ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, license: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                rows={3}
                value={editForm.bio ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setEditUser(null); setEditForm({}); }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updating}
              style={{ backgroundColor: "#2E8B57" }}
              className="text-white"
            >
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This will also delete
              all their properties, messages, and visits. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog
        open={!!editRoleUser}
        onOpenChange={() => setEditRoleUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change role for {editRoleUser?.name ?? editRoleUser?.email} from{" "}
              <strong>{editRoleUser?.role}</strong> to{" "}
              <strong>
                {editRoleUser?.role === "ADMIN" ? "AGENT" : "ADMIN"}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRoleUser(null)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={updatingRole}>
              {updatingRole ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
