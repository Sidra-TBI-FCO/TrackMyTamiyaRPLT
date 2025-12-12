import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChevronUp, MessageSquarePlus, Filter, User } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import type { FeedbackPostWithUser } from "@shared/schema";

const CATEGORIES = [
  { value: "feature", label: "Feature Request" },
  { value: "bug", label: "Bug Report" },
  { value: "improvement", label: "Improvement" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "open", label: "Open", color: "bg-blue-500" },
  { value: "planned", label: "Planned", color: "bg-purple-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "declined", label: "Declined", color: "bg-gray-500" },
];

export default function FeedbackPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("feature");

  const queryParams = new URLSearchParams();
  if (filterCategory) queryParams.set("category", filterCategory);
  if (filterStatus) queryParams.set("status", filterStatus);
  const queryString = queryParams.toString();

  const { data: posts, isLoading } = useQuery<FeedbackPostWithUser[]>({
    queryKey: ["/api/feedback", queryString],
    queryFn: async () => {
      const response = await fetch(`/api/feedback${queryString ? `?${queryString}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch feedback");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      return apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      setIsDialogOpen(false);
      setTitle("");
      setDescription("");
      setCategory("feature");
      toast({ title: "Feedback submitted!", description: "Thank you for your feedback." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit feedback", variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, hasVoted }: { id: number; hasVoted: boolean }) => {
      const method = hasVoted ? "DELETE" : "POST";
      return apiRequest(method, `/api/feedback/${id}/vote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to vote", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title, description, category });
  };

  const handleVote = (post: FeedbackPostWithUser) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to vote", variant: "destructive" });
      return;
    }
    voteMutation.mutate({ id: post.id, hasVoted: post.hasVoted || false });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUSES.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color || "bg-gray-500"} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span style={{ color: "var(--theme-primary)" }}>Feature</span>{" "}
              <span style={{ color: "var(--theme-secondary)" }}>Requests</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help shape the future of TrackMyRC! Submit your ideas, report bugs, and vote for features you'd like to see.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-filter-category">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                {isAuthenticated ? (
                  <Button style={{ backgroundColor: "var(--theme-primary)" }} className="text-white" data-testid="button-new-feedback">
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </Button>
                ) : (
                  <Link href="/auth">
                    <Button style={{ backgroundColor: "var(--theme-primary)" }} className="text-white" data-testid="button-sign-in-to-submit">
                      Sign in to Submit
                    </Button>
                  </Link>
                )}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Submit Feedback</DialogTitle>
                  <DialogDescription>
                    Share your ideas, report bugs, or suggest improvements.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of your feedback"
                      maxLength={200}
                      data-testid="input-feedback-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about your suggestion or issue..."
                      rows={5}
                      data-testid="input-feedback-description"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-white"
                    style={{ backgroundColor: "var(--theme-primary)" }}
                    disabled={createMutation.isPending}
                    data-testid="button-submit-feedback"
                  >
                    {createMutation.isPending ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`card-feedback-${post.id}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(post)}
                          className={`flex flex-col items-center p-2 h-auto ${
                            post.hasVoted ? "text-white" : "text-muted-foreground hover:text-foreground"
                          }`}
                          style={post.hasVoted ? { backgroundColor: "var(--theme-primary)" } : {}}
                          disabled={voteMutation.isPending}
                          data-testid={`button-vote-${post.id}`}
                        >
                          <ChevronUp className="w-5 h-5" />
                          <span className="text-lg font-bold">{post.voteCount}</span>
                        </Button>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline">{getCategoryLabel(post.category)}</Badge>
                          {getStatusBadge(post.status)}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3 whitespace-pre-wrap">{post.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {post.user.profileImageUrl ? (
                              <img src={post.user.profileImageUrl} alt="" className="w-4 h-4 rounded-full" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            <span>{post.user.firstName || "Anonymous"} {post.user.lastName || ""}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquarePlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to share your ideas!</p>
                {isAuthenticated ? (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    style={{ backgroundColor: "var(--theme-primary)" }}
                    className="text-white"
                  >
                    Submit Feedback
                  </Button>
                ) : (
                  <Link href="/auth">
                    <Button style={{ backgroundColor: "var(--theme-primary)" }} className="text-white">
                      Sign in to Submit
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}