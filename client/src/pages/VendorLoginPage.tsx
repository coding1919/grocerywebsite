import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  phone: z.string().min(10, { message: "Please enter a valid 10-digit Indian mobile number" }).max(10),
  gstin: z.string().optional(),
  fssaiLicense: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function VendorLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      address: "",
      phone: "",
      gstin: "",
      fssaiLicense: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "You have been logged in as a vendor",
      });
      navigate("/vendor/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/users", {
        ...data,
        isVendor: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your vendor account has been created, please log in",
      });
      setActiveTab("login");
      registerForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen py-8 flex items-center">
      <Helmet>
        <title>Seller Portal - GroceryDukan</title>
        <meta name="description" content="Log in to the GroceryDukan seller portal to manage your store and products." />
      </Helmet>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Seller Portal</CardTitle>
                <CardDescription>
                  Sign in to manage your grocery store on GroceryDukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
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
                                <Input type="password" placeholder="Enter your password" {...field} />
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
                          {loginMutation.isPending ? (
                            <span className="flex items-center">
                              <i className="ri-loader-4-line animate-spin mr-2"></i>
                              Signing in...
                            </span>
                          ) : (
                            'Sign In'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Owner Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Choose a username" {...field} />
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
                                  <Input type="password" placeholder="Create a password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Address</FormLabel>
                              <FormControl>
                                <Input placeholder="A-42, Sector 62, Noida, UP 201301" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl>
                                <Input placeholder="9876543210" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="gstin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GSTIN (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="22AAAAA0000A1Z5" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="fssaiLicense"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FSSAI License (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="12345678901234" {...field} />
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
                          {registerMutation.isPending ? (
                            <span className="flex items-center">
                              <i className="ri-loader-4-line animate-spin mr-2"></i>
                              Creating Account...
                            </span>
                          ) : (
                            'Create Vendor Account'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="hidden lg:flex flex-col justify-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Grow Your Business with GroceryDukan</h2>
              <p className="text-gray-700 mb-6">
                Join India's fastest growing grocery platform to connect with customers in your neighborhood. Manage your inventory, track orders, and boost your sales.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-3">
                    <i className="ri-store-2-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Create Your Store Profile</h3>
                    <p className="text-gray-600">Showcase your products and services to nearby customers</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-3">
                    <i className="ri-shopping-bag-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Manage Orders Efficiently</h3>
                    <p className="text-gray-600">Track orders, manage inventory, and process deliveries seamlessly</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white rounded-full p-2 mr-3">
                    <i className="ri-line-chart-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Grow Your Business</h3>
                    <p className="text-gray-600">Access analytics and insights to boost your sales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
