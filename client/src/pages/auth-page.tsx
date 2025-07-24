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

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: "Welcome to TrackMyTamiya!",
        description: `Account created for ${user.firstName} ${user.lastName}`,
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
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 dark:from-blue-950 dark:via-gray-900 dark:to-red-950">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 min-h-screen">
          {/* Left side - Authentication Forms */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              {/* Logo and Title */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="bg-tamiya-red dark:bg-tamiya-blue p-2 rounded-lg">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    TrackMyTamiya
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Join the community of RC enthusiasts
                </p>
              </div>

              {/* Quick Replit Login */}
              <Card className="border-tamiya-red/20 dark:border-tamiya-blue/20">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Quick Access</CardTitle>
                  <CardDescription>
                    Login instantly with your Replit account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    className="w-full bg-tamiya-red hover:bg-tamiya-red/90 dark:bg-tamiya-blue dark:hover:bg-tamiya-blue/90"
                  >
                    Continue with Replit
                  </Button>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
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
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email" 
                                  placeholder="your@email.com"
                                  autoComplete="email"
                                  id="register-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerMutation.isPending}
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
                  Track your Tamiya models, document builds, manage hop-up parts, and organize your photos all in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div className="text-center space-y-2">
                  <div className="bg-tamiya-red dark:bg-tamiya-blue p-3 rounded-lg mx-auto w-fit">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Model Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Catalog your entire collection with detailed specifications
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="bg-tamiya-red dark:bg-tamiya-blue p-3 rounded-lg mx-auto w-fit">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Build Logs</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Document your builds with photos and voice notes
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="bg-tamiya-red dark:bg-tamiya-blue p-3 rounded-lg mx-auto w-fit">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Hop-Up Parts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track performance upgrades and modifications
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="bg-tamiya-red dark:bg-tamiya-blue p-3 rounded-lg mx-auto w-fit">
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