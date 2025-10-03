import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle2 } from "lucide-react";
import MarketingHeader from "@/components/layout/marketing-header";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      toast({
        variant: "destructive",
        title: "Invalid Reset Link",
        description: "This password reset link is invalid or missing the token.",
      });
      setTimeout(() => setLocation("/forgot-password"), 3000);
    } else {
      setToken(tokenParam);
    }
  }, [toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Token",
        description: "The reset token is missing.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: "Success!",
          description: data.message,
        });
        // Redirect to login after 3 seconds
        setTimeout(() => setLocation("/auth"), 3000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to reset password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <MarketingHeader />
        <div className="container max-w-md mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Invalid Reset Link</CardTitle>
              <CardDescription className="text-center">
                Redirecting you to request a new link...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <MarketingHeader />
      
      <div className="container max-w-md mx-auto px-4 py-16">
        <Card data-testid="card-reset-password">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {resetSuccess ? "Password Reset Complete" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {resetSuccess 
                ? "You can now log in with your new password"
                : "Enter your new password below"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    Your password has been successfully reset!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Redirecting you to the login page...
                  </p>
                </div>

                <Button
                  className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-go-to-login"
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-10"
                      data-testid="input-new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-10"
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Both passwords must match</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90"
                  disabled={isLoading || !token}
                  data-testid="button-submit"
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
