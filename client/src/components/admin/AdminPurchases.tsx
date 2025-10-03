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
import { DollarSign } from "lucide-react";

interface Purchase {
  id: number;
  modelCount: number;
  amount: string;
  currency: string;
  paymentProvider: string;
  paymentId: string;
  status: string;
  createdAt: string;
  userEmail: string;
  userId: string;
}

export function AdminPurchases() {
  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/admin/purchases"],
  });
  
  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(amount));
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      case 'refunded':
        return 'text-gray-600';
      default:
        return '';
    }
  };
  
  const totalRevenue = purchases?.reduce((sum, purchase) => {
    if (purchase.status === 'completed') {
      return sum + parseFloat(purchase.amount);
    }
    return sum;
  }, 0) || 0;
  
  if (isLoading) {
    return <div className="text-center py-8">Loading purchases...</div>;
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Purchase History</span>
            <div className="flex items-center gap-2 text-[var(--theme-primary)]">
              <DollarSign className="w-5 h-5" />
              <span className="text-2xl font-bold">
                ${totalRevenue.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground font-normal">total</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases && purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                      <TableCell className="text-sm">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{purchase.userEmail}</TableCell>
                      <TableCell>{purchase.modelCount} models</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(purchase.amount, purchase.currency)}
                      </TableCell>
                      <TableCell className="capitalize">{purchase.paymentProvider}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {purchase.paymentId || "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`capitalize font-medium ${getStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No purchases yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
