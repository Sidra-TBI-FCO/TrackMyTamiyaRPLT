import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, loginUserSchema, type RegisterUser, type LoginUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Star, Car, Settings, Wrench } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Simple state for debugging email field
  const [emailValue, setEmailValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Login form
  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
    mode: "onChange",
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.firstName} ${user.lastName}`,
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome to TrackMyRC!",
        description: `Account created for ${user.firstName} ${user.lastName}. Please check your email to verify your account.`,
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterUser) => {
    // Check password confirmation
    if (confirmPassword !== data.password) {
      toast({
        title: "Password Mismatch",
        description: "Please ensure both password fields match",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 min-h-screen">
          {/* Left side - Authentication Forms */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              {/* Logo and Title */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="p-2 rounded-lg" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    TrackMyRC
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Join the community of RC enthusiasts
                </p>
              </div>



              {/* OAuth Authentication - Temporarily Disabled */}
              <Card className="mb-6 opacity-50">
                <CardHeader>
                  <CardTitle className="text-center">Quick Sign In</CardTitle>
                  <CardDescription className="text-center">
                    OAuth authentication temporarily disabled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    disabled
                    className="w-full flex items-center justify-center space-x-2 h-11"
                  >
                    <SiGoogle className="h-5 w-5 text-gray-400" />
                    <span>Continue with Google (Coming Soon)</span>
                  </Button>
                  <Button
                    variant="outline"
                    disabled
                    className="w-full flex items-center justify-center space-x-2 h-11"
                  >
                    <div className="bg-gray-400 p-1 rounded">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                    <span>Continue with Replit (Coming Soon)</span>
                  </Button>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email/Password Authentication */}
              <Card>
                <CardHeader>
                  <div className="flex justify-center space-x-1 mb-4">
                    <Button
                      variant={isLogin ? "default" : "ghost"}
                      onClick={() => setIsLogin(true)}
                      className="flex-1"
                    >
                      Login
                    </Button>
                    <Button
                      variant={!isLogin ? "default" : "ghost"}
                      onClick={() => setIsLogin(false)}
                      className="flex-1"
                    >
                      Register
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLogin ? (
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email" 
                                  placeholder="your@email.com"
                                  autoComplete="username email"
                                  id="login-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="••••••••" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="John"
                                    autoComplete="given-name"
                                    id="register-firstName"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Doe"
                                    autoComplete="family-name"
                                    id="register-lastName"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="test-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Email
                          </label>
                          <input 
                            id="test-email"
                            type="text"
                            value={emailValue}
                            onChange={(e) => {
                              setEmailValue(e.target.value);
                              registerForm.setValue("email", e.target.value);
                            }}
                            placeholder="your@email.com"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="••••••••" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                          <label htmlFor="confirm-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Confirm Password
                          </label>
                          <input 
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          {confirmPassword && confirmPassword !== registerForm.watch("password") && (
                            <p className="text-sm text-destructive">Passwords do not match</p>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerMutation.isPending || (confirmPassword !== "" && confirmPassword !== registerForm.watch("password"))}
                        >
                          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right side - Hero/Features */}
          <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl lg:rounded-none">
            <div className="text-center space-y-8 p-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Manage Your RC Collection
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
                  Track your RC models, document builds, manage hop-up parts, and organize your photos all in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div className="text-center space-y-2">
                  <div className="p-3 rounded-lg mx-auto w-fit" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Model Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Catalog your entire collection with detailed specifications
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="p-3 rounded-lg mx-auto w-fit" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Build Logs</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Document your builds with photos and voice notes
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="p-3 rounded-lg mx-auto w-fit" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Hop-Up Parts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track performance upgrades and modifications
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="p-3 rounded-lg mx-auto w-fit" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Photo Gallery</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organize and showcase your models with high-quality photos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}