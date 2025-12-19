import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, RefreshCw, AlertTriangle, Check, X, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FIELD_OPTION_KEYS, type FieldOption, type FieldOptionKey } from "@shared/schema";

const FIELD_LABELS: Record<FieldOptionKey, string> = {
  scale: "Scale",
  driveType: "Drive Type",
  chassisMaterial: "Chassis Material",
  differentialType: "Differential Type",
  motorSize: "Motor Size",
  batteryType: "Battery Type",
  buildStatus: "Build Status",
  hopUpCategory: "Hop-Up Category",
};

interface FieldOptionsResponse {
  options: Record<string, FieldOption[]>;
  fieldKeys: readonly string[];
}

export function AdminFieldOptions() {
  const [selectedField, setSelectedField] = useState<FieldOptionKey>("scale");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<FieldOption | null>(null);
  const [newValue, setNewValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<FieldOptionsResponse>({
    queryKey: ["/api/admin/field-options"],
  });

  const createMutation = useMutation({
    mutationFn: async (option: { fieldKey: string; value: string }) => {
      const res = await apiRequest("POST", "/api/admin/field-options", option);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/field-options"] });
      setIsAddOpen(false);
      setNewValue("");
      toast({ title: "Option added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add option", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/field-options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/field-options"] });
      toast({ title: "Option deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete option", variant: "destructive" });
    },
  });

  const replaceMutation = useMutation({
    mutationFn: async ({ id, newValue }: { id: number; newValue: string }) => {
      const res = await apiRequest("POST", `/api/admin/field-options/${id}/replace`, { newValue });
      return res.json();
    },
    onSuccess: (data: { recordsUpdated: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/field-options"] });
      setIsReplaceOpen(false);
      setSelectedOption(null);
      setReplaceValue("");
      toast({ title: "Option replaced", description: `Updated ${data.recordsUpdated} records` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to replace option", variant: "destructive" });
    },
  });

  const { data: usageData } = useQuery<{ usageCount: number }>({
    queryKey: ["/api/admin/field-options", selectedOption?.id, "usage"],
    enabled: !!selectedOption && isReplaceOpen,
  });

  const options = data?.options?.[selectedField] || [];

  const handleAddOption = () => {
    if (!newValue.trim()) return;
    createMutation.mutate({ fieldKey: selectedField, value: newValue.trim() });
  };

  const handleDeleteOption = (option: FieldOption) => {
    if (confirm(`Are you sure you want to delete "${option.value}"? This cannot be undone.`)) {
      deleteMutation.mutate(option.id);
    }
  };

  const handleReplaceClick = (option: FieldOption) => {
    setSelectedOption(option);
    setReplaceValue(option.value);
    setIsReplaceOpen(true);
  };

  const handleReplace = () => {
    if (!selectedOption || !replaceValue.trim()) return;
    replaceMutation.mutate({ id: selectedOption.id, newValue: replaceValue.trim() });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Options</CardTitle>
          <CardDescription>Manage dropdown options for model fields</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Field Options</CardTitle>
            <CardDescription>
              Manage dropdown options for model fields. When you update an option, all models using that value will be updated.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-options">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select Field Type</label>
            <Select value={selectedField} onValueChange={(v) => setSelectedField(v as FieldOptionKey)}>
              <SelectTrigger data-testid="select-field-type">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTION_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {FIELD_LABELS[key]} ({data?.options?.[key]?.length || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pt-6">
            <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-option">
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No options defined for {FIELD_LABELS[selectedField]}. Add some options to get started.
                  </TableCell>
                </TableRow>
              ) : (
                options.map((option, index) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{option.value}</TableCell>
                    <TableCell>
                      {option.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReplaceClick(option)}
                          data-testid={`button-edit-option-${option.id}`}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOption(option)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-option-${option.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Option</DialogTitle>
              <DialogDescription>
                Add a new option to the {FIELD_LABELS[selectedField]} dropdown.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Option Value</label>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`Enter ${FIELD_LABELS[selectedField].toLowerCase()} value...`}
                  data-testid="input-new-option-value"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddOption} 
                disabled={!newValue.trim() || createMutation.isPending}
                data-testid="button-confirm-add-option"
              >
                {createMutation.isPending ? "Adding..." : "Add Option"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isReplaceOpen} onOpenChange={setIsReplaceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Option</DialogTitle>
              <DialogDescription>
                Renaming this option will update all records that use it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {usageData && usageData.usageCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    This option is used by <strong>{usageData.usageCount}</strong> records. All will be updated.
                  </span>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Current Value</label>
                <Input value={selectedOption?.value || ""} disabled />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">New Value</label>
                <Input
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Enter new value..."
                  data-testid="input-replace-value"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReplaceOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleReplace} 
                disabled={!replaceValue.trim() || replaceValue === selectedOption?.value || replaceMutation.isPending}
                data-testid="button-confirm-replace"
              >
                {replaceMutation.isPending ? "Updating..." : "Update All Records"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
