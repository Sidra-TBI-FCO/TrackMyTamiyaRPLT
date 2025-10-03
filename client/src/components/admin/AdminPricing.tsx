import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit } from "lucide-react";

interface PricingTier {
  id: number;
  modelCount: number;
  basePrice: string;
  discountPercent: number;
  finalPrice: string;
  isActive: boolean;
}

export function AdminPricing() {
  const { toast } = useToast();
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    modelCount: 0,
    basePrice: 0,
    discountPercent: 0,
  });
  
  const { data: tiers, isLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/admin/pricing"],
  });
  
  const updatePricingMutation = useMutation({
    mutationFn: async (data: { id: number; modelCount: number; basePrice: number; discountPercent: number; finalPrice: number; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/pricing/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({ title: "Pricing updated successfully" });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to update pricing", variant: "destructive" });
    },
  });
  
  const handleEdit = (tier: PricingTier) => {
    setEditingTier(tier);
    setFormData({
      modelCount: tier.modelCount,
      basePrice: parseFloat(tier.basePrice),
      discountPercent: tier.discountPercent,
    });
    setShowEditDialog(true);
  };
  
  const handleSave = () => {
    if (!editingTier) return;
    
    const finalPrice = formData.basePrice * (1 - formData.discountPercent / 100);
    
    updatePricingMutation.mutate({
      id: editingTier.id,
      modelCount: formData.modelCount,
      basePrice: formData.basePrice,
      discountPercent: formData.discountPercent,
      finalPrice,
      isActive: true,
    });
  };
  
  const calculateFinalPrice = (basePrice: number, discountPercent: number) => {
    return basePrice * (1 - discountPercent / 100);
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading pricing...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure pricing for model pack purchases. Discounts are automatically applied.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Pack Size</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Price per Model</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers && tiers.length > 0 ? (
                tiers.map((tier) => {
                  const pricePerModel = parseFloat(tier.finalPrice) / tier.modelCount;
                  return (
                    <TableRow key={tier.id} data-testid={`row-pricing-${tier.modelCount}`}>
                      <TableCell className="font-medium">{tier.modelCount} Models</TableCell>
                      <TableCell>${parseFloat(tier.basePrice).toFixed(2)}</TableCell>
                      <TableCell>{tier.discountPercent}%</TableCell>
                      <TableCell className="font-bold text-[var(--theme-primary)]">
                        ${parseFloat(tier.finalPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        ${pricePerModel.toFixed(2)} each
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(tier)}
                          data-testid={`button-edit-pricing-${tier.modelCount}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No pricing tiers configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Edit Pricing Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pricing Tier</DialogTitle>
            <DialogDescription>
              Update pricing for {editingTier?.modelCount} model pack
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                data-testid="input-base-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercent">Discount (%)</Label>
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                data-testid="input-discount-percent"
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Final Price Preview:</p>
              <p className="text-2xl font-bold text-[var(--theme-primary)] mt-2">
                ${calculateFinalPrice(formData.basePrice, formData.discountPercent).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ${(calculateFinalPrice(formData.basePrice, formData.discountPercent) / (editingTier?.modelCount || 1)).toFixed(2)} per model
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePricingMutation.isPending}
              data-testid="button-save-pricing"
            >
              {updatePricingMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
