import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Zap, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { Motor } from "@shared/schema";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional()
);

const motorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  itemNumber: z.string().optional(),
  motorType: z.enum(["brushed", "brushless"]),
  isSensored: z.boolean().optional(),
  kv: optionalNumber,
  turns: optionalNumber,
  diameter: z.string().optional(),
  canSize: z.string().optional(),
  cost: optionalNumber,
  notes: z.string().optional(),
});

type MotorFormData = z.infer<typeof motorFormSchema>;

interface MotorDialogProps {
  motor?: Motor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (motor: Motor) => void;
}

export default function MotorDialog({ motor, open, onOpenChange, onSuccess }: MotorDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const form = useForm<MotorFormData>({
    resolver: zodResolver(motorFormSchema),
    defaultValues: {
      name: "",
      manufacturer: "",
      itemNumber: "",
      motorType: "brushed",
      isSensored: false,
      kv: undefined,
      turns: undefined,
      diameter: "",
      canSize: "",
      cost: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (motor) {
        form.reset({
          name: motor.name || "",
          manufacturer: motor.manufacturer || "",
          itemNumber: motor.itemNumber || "",
          motorType: (motor.motorType as "brushed" | "brushless") || "brushed",
          isSensored: motor.isSensored || false,
          kv: motor.kv || undefined,
          turns: motor.turns || undefined,
          diameter: motor.diameter || "",
          canSize: motor.canSize || "",
          cost: motor.cost ? parseFloat(motor.cost) : undefined,
          notes: motor.notes || "",
        });
      } else {
        form.reset({
          name: "",
          manufacturer: "",
          itemNumber: "",
          motorType: "brushed",
          isSensored: false,
          kv: undefined,
          turns: undefined,
          diameter: "",
          canSize: "",
          cost: undefined,
          notes: "",
        });
      }
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoRemoved(false);
    }
  }, [open, motor, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: MotorFormData) => {
      let photoId: number | undefined;
      if (photo) {
        setIsUploadingPhoto(true);
        const formData = new FormData();
        formData.append("photo", photo);
        formData.append("caption", `${data.name} photo`);
        const photoRes = await fetch("/api/electronics/photos", { method: "POST", body: formData, credentials: "include" });
        if (photoRes.ok) {
          const photoData = await photoRes.json();
          photoId = photoData.id;
        }
        setIsUploadingPhoto(false);
      }
      const res = await apiRequest("POST", "/api/electronics/motors", { ...data, photoId });
      return res.json();
    },
    onSuccess: (newMotor: Motor) => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/motors"] });
      toast({ title: "Motor added successfully" });
      onOpenChange(false);
      if (onSuccess) onSuccess(newMotor);
    },
    onError: (error: Error) => {
      setIsUploadingPhoto(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MotorFormData) => {
      let photoId: number | null | undefined = motor?.photoId ?? undefined;
      
      if (photo) {
        setIsUploadingPhoto(true);
        const formData = new FormData();
        formData.append("photo", photo);
        formData.append("caption", `${data.name} photo`);
        const photoRes = await fetch("/api/electronics/photos", { method: "POST", body: formData, credentials: "include" });
        if (photoRes.ok) {
          const photoData = await photoRes.json();
          photoId = photoData.id;
        }
        setIsUploadingPhoto(false);
      } else if (photoRemoved) {
        photoId = null;
      }
      
      const res = await apiRequest("PUT", `/api/electronics/motors/${motor?.id}`, { ...data, photoId });
      return res.json();
    },
    onSuccess: (updatedMotor: Motor) => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/motors"] });
      toast({ title: "Motor updated successfully" });
      onOpenChange(false);
      if (onSuccess) onSuccess(updatedMotor);
    },
    onError: (error: Error) => {
      setIsUploadingPhoto(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: MotorFormData) => {
    if (motor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploadingPhoto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {motor ? "Edit Motor" : "Add Motor"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
                    <button type="button" onClick={handleRemovePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span><Upload className="h-4 w-4 mr-2" />Upload</span>
                  </Button>
                </label>
              </div>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder="e.g., Tamiya Sport Tuned" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="manufacturer" render={({ field }) => (
                <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input {...field} placeholder="e.g., Tamiya" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="itemNumber" render={({ field }) => (
                <FormItem><FormLabel>Item Number</FormLabel><FormControl><Input {...field} placeholder="e.g., 53068" /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="motorType" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="brushed">Brushed</SelectItem>
                      <SelectItem value="brushless">Brushless</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="isSensored" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Sensored</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="kv" render={({ field }) => (
                <FormItem><FormLabel>KV Rating</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g., 3000" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="turns" render={({ field }) => (
                <FormItem><FormLabel>Turns</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g., 17" /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="diameter" render={({ field }) => (
                <FormItem><FormLabel>Diameter</FormLabel><FormControl><Input {...field} placeholder="e.g., 540" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="canSize" render={({ field }) => (
                <FormItem><FormLabel>Can Size</FormLabel><FormControl><Input {...field} placeholder="e.g., 3650" /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="cost" render={({ field }) => (
              <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} placeholder="0.00" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} placeholder="Additional notes..." /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : (motor ? "Update Motor" : "Add Motor")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
