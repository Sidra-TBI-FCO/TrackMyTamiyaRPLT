import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User } from "lucide-react";

interface AdminLog {
  id: number;
  action: string;
  adminEmail: string;
  targetUserEmail: string;
  details: any;
  ipAddress: string;
  createdAt: string;
}

interface UserLog {
  id: number;
  activityType: string;
  userEmail: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export function AdminActivity() {
  const { data: adminLogs, isLoading: adminLoading } = useQuery<AdminLog[]>({
    queryKey: ["/api/admin/activity-log"],
  });
  
  const { data: userLogs, isLoading: userLoading } = useQuery<UserLog[]>({
    queryKey: ["/api/admin/user-activity"],
  });
  
  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Actions
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              User Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin" className="mt-4">
            {adminLoading ? (
              <div className="text-center py-8">Loading admin logs...</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminLogs && adminLogs.length > 0 ? (
                      adminLogs.map((log) => (
                        <TableRow key={log.id} data-testid={`row-admin-log-${log.id}`}>
                          <TableCell className="font-medium">{formatAction(log.action)}</TableCell>
                          <TableCell>{log.adminEmail}</TableCell>
                          <TableCell>{log.targetUserEmail || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.ipAddress}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No admin actions logged yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="user" className="mt-4">
            {userLoading ? (
              <div className="text-center py-8">Loading user activity...</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLogs && userLogs.length > 0 ? (
                      userLogs.map((log) => (
                        <TableRow key={log.id} data-testid={`row-user-log-${log.id}`}>
                          <TableCell className="font-medium">{formatAction(log.activityType)}</TableCell>
                          <TableCell>{log.userEmail}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.ipAddress}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No user activity logged yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
