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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, MessageSquare, Trash2, CheckCircle, Clock, XCircle, CircleDot } from "lucide-react";
import { format } from "date-fns";

interface FeedbackPost {
  id: number;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  voteCount: number;
  createdAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email?: string;
  };
}

export function AdminFeedback() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<FeedbackPost | null>(null);
  
  const { data: feedbackPosts, isLoading } = useQuery<FeedbackPost[]>({
    queryKey: ["/api/admin/feedback"],
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/feedback/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/feedback/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({ title: "Feedback deleted successfully" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Failed to delete feedback", variant: "destructive" });
    },
  });
  
  const filteredPosts = feedbackPosts?.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      post.title.toLowerCase().includes(searchLower) ||
      post.description.toLowerCase().includes(searchLower) ||
      (post.user?.firstName?.toLowerCase() || "").includes(searchLower) ||
      (post.user?.lastName?.toLowerCase() || "").includes(searchLower);
    
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500"><CircleDot className="w-3 h-3 mr-1" />Open</Badge>;
      case 'planned':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" />Planned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'feature':
        return <Badge variant="secondary">Feature</Badge>;
      case 'bug':
        return <Badge variant="destructive">Bug</Badge>;
      case 'improvement':
        return <Badge variant="outline">Improvement</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p>Loading feedback...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          User Feedback ({feedbackPosts?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all" 
              ? "No feedback matches your filters" 
              : "No feedback submitted yet"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{post.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {post.user ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim() || 'Unknown' : 'Unknown'}
                      </p>
                    </TableCell>
                    <TableCell>{getCategoryBadge(post.category)}</TableCell>
                    <TableCell>
                      <Select
                        value={post.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: post.id, status })}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>{getStatusBadge(post.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.voteCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(post)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
