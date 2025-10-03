import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Plus, Trash2, RotateCw, Shield, ShieldOff, CheckCircle2, XCircle } from "lucide-react";

interface UserWithStats {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isVerified: boolean;
  modelLimit: number;
  manuallyGrantedModels: number;
  modelCount: number;
  storageUsed: number;
  totalSpent: number;
  lastLogin: string | null;
  createdAt: string;
}

export function AdminUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [grantModelsCount, setGrantModelsCount] = useState<number>(10);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: users, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/admin/users"],
  });
  
  const grantModelsMutation = useMutation({
    mutationFn: async ({ userId, modelCount }: { userId: string; modelCount: number }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/grant-models`, { modelCount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Models granted successfully" });
      setShowGrantDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to grant models", variant: "destructive" });
    },
  });
  
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
    },
    onSuccess: () => {
      toast({ title: "Password reset email sent" });
    },
    onError: () => {
      toast({ title: "Failed to send reset email", variant: "destructive" });
    },
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });
  
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const endpoint = makeAdmin ? "make-admin" : "remove-admin";
      return apiRequest("POST", `/api/admin/users/${userId}/${endpoint}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update admin status", variant: "destructive" });
    },
  });
  
  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search-users"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Models</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">
                      {user.email}
                      {user.isAdmin && (
                        <Shield className="inline-block ml-2 h-4 w-4 text-[var(--theme-primary)]" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>
                      {user.isVerified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" data-testid={`status-verified-${user.id}`} />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" data-testid={`status-unverified-${user.id}`} />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.modelCount} / {user.modelLimit}
                      {user.manuallyGrantedModels > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (+{user.manuallyGrantedModels})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatBytes(user.storageUsed)}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(user.totalSpent?.toString() || "0"))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowGrantDialog(true);
                          }}
                          data-testid={`button-grant-models-${user.id}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Grant
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetPasswordMutation.mutate(user.id)}
                          data-testid={`button-reset-password-${user.id}`}
                        >
                          <RotateCw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAdminMutation.mutate({ userId: user.id, makeAdmin: !user.isAdmin })}
                          data-testid={`button-toggle-admin-${user.id}`}
                        >
                          {user.isAdmin ? (
                            <ShieldOff className="h-3 w-3" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Grant Models Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Models to User</DialogTitle>
            <DialogDescription>
              Add models to {selectedUser?.email}'s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modelCount">Number of Models</Label>
              <Input
                id="modelCount"
                type="number"
                min="1"
                value={grantModelsCount}
                onChange={(e) => setGrantModelsCount(parseInt(e.target.value) || 0)}
                data-testid="input-grant-models-count"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && grantModelsMutation.mutate({ 
                userId: selectedUser.id, 
                modelCount: grantModelsCount 
              })}
              disabled={grantModelsMutation.isPending}
              data-testid="button-confirm-grant-models"
            >
              {grantModelsMutation.isPending ? "Granting..." : "Grant Models"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This will permanently delete
              their account and all associated data (models, photos, etc.). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
