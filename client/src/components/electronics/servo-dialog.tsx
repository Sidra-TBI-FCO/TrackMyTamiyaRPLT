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
import { Settings2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { Servo } from "@shared/schema";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional()
);

const servoFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  itemNumber: z.string().optional(),
  servoType: z.enum(["standard", "low-profile", "mini", "micro"]),
  torque: z.string().optional(),
  speed: z.string().optional(),
  voltage: z.string().optional(),
  gearType: z.enum(["plastic", "metal", "titanium"]).optional(),
  isDigital: z.boolean().optional(),
  isWaterproof: z.boolean().optional(),
  cost: optionalNumber,
  notes: z.string().optional(),
});

type ServoFormData = z.infer<typeof servoFormSchema>;

interface ServoDialogProps {
  servo?: Servo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (servo: Servo) => void;
}

export default function ServoDialog({ servo, open, onOpenChange, onSuccess }: ServoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const form = useForm<ServoFormData>({
    resolver: zodResolver(servoFormSchema),
    defaultValues: {
      name: "",
      manufacturer: "",
      itemNumber: "",
      servoType: "standard",
      torque: "",
      speed: "",
      voltage: "",
      gearType: undefined,
      isDigital: false,
      isWaterproof: false,
      cost: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (servo) {
        form.reset({
          name: servo.name || "",
          manufacturer: servo.manufacturer || "",
          itemNumber: servo.itemNumber || "",
          servoType: (servo.servoType as "standard" | "low-profile" | "mini" | "micro") || "standard",
          torque: servo.torque || "",
          speed: servo.speed || "",
          voltage: servo.voltage || "",
          gearType: (servo.gearType as "plastic" | "metal" | "titanium") || undefined,
          isDigital: servo.isDigital || false,
          isWaterproof: servo.isWaterproof || false,
          cost: servo.cost ? parseFloat(servo.cost) : undefined,
          notes: servo.notes || "",
        });
      } else {
        form.reset({
          name: "",
          manufacturer: "",
          itemNumber: "",
          servoType: "standard",
          torque: "",
          speed: "",
          voltage: "",
          gearType: undefined,
          isDigital: false,
          isWaterproof: false,
          cost: undefined,
          notes: "",
        });
      }
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoRemoved(false);
    }
  }, [open, servo, form]);

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
    mutationFn: async (data: ServoFormData) => {
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
      const res = await apiRequest("POST", "/api/electronics/servos", { ...data, photoId });
      return res.json();
    },
    onSuccess: (newServo: Servo) => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/servos"] });
      toast({ title: "Servo added successfully" });
      onOpenChange(false);
      if (onSuccess) onSuccess(newServo);
    },
    onError: (error: Error) => {
      setIsUploadingPhoto(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServoFormData) => {
      let photoId: number | null | undefined = servo?.photoId ?? undefined;
      
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
      
      const res = await apiRequest("PUT", `/api/electronics/servos/${servo?.id}`, { ...data, photoId });
      return res.json();
    },
    onSuccess: (updatedServo: Servo) => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/servos"] });
      toast({ title: "Servo updated successfully" });
      onOpenChange(false);
      if (onSuccess) onSuccess(updatedServo);
    },
    onError: (error: Error) => {
      setIsUploadingPhoto(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ServoFormData) => {
    if (servo) {
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
            <Settings2 className="h-5 w-5" />
            {servo ? "Edit Servo" : "Add Servo"}
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
              <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder="e.g., Savox SC-1258TG" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="manufacturer" render={({ field }) => (
                <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input {...field} placeholder="e.g., Savox" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="itemNumber" render={({ field }) => (
                <FormItem><FormLabel>Item Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="servoType" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="low-profile">Low Profile</SelectItem>
                      <SelectItem value="mini">Mini</SelectItem>
                      <SelectItem value="micro">Micro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="gearType" render={({ field }) => (
                <FormItem><FormLabel>Gear Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="plastic">Plastic</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="titanium">Titanium</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="torque" render={({ field }) => (
                <FormItem><FormLabel>Torque</FormLabel><FormControl><Input {...field} placeholder="e.g., 12kg-cm" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="speed" render={({ field }) => (
                <FormItem><FormLabel>Speed</FormLabel><FormControl><Input {...field} placeholder="e.g., 0.12s/60°" /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="voltage" render={({ field }) => (
              <FormItem><FormLabel>Voltage</FormLabel><FormControl><Input {...field} placeholder="e.g., 4.8V-7.4V" /></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="isDigital" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Digital</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="isWaterproof" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Waterproof</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="cost" render={({ field }) => (
              <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} placeholder="0.00" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} placeholder="Additional notes..." /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : (servo ? "Update Servo" : "Add Servo")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
