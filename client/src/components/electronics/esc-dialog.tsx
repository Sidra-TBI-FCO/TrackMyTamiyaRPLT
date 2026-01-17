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
import { Gauge, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { Esc } from "@shared/schema";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional()
);

const escFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  itemNumber: z.string().optional(),
  escType: z.enum(["brushed", "brushless", "sensored"]),
  maxAmps: optionalNumber,
  maxVoltage: z.string().optional(),
  bec: z.string().optional(),
  programmable: z.boolean().optional(),
  cost: optionalNumber,
  notes: z.string().optional(),
});

type EscFormData = z.infer<typeof escFormSchema>;

interface EscDialogProps {
  esc?: Esc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (esc: Esc) => void;
}

export default function EscDialog({ esc, open, onOpenChange, onSuccess }: EscDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const form = useForm<EscFormData>({
    resolver: zodResolver(escFormSchema),
    defaultValues: {
      name: "",
      manufacturer: "",
      itemNumber: "",
      escType: "brushed",
      maxAmps: undefined,
      maxVoltage: "",
      bec: "",
      programmable: false,
      cost: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (esc) {
        form.reset({
          name: esc.name || "",
          manufacturer: esc.manufacturer || "",
          itemNumber: esc.itemNumber || "",
          escType: (esc.escType as "brushed" | "brushless" | "sensored") || "brushed",
          maxAmps: esc.maxAmps || undefined,
          maxVoltage: esc.maxVoltage || "",
          bec: esc.bec || "",
          programmable: esc.programmable || false,
          cost: esc.cost ? parseFloat(esc.cost) : undefined,
          notes: esc.notes || "",
        });
      } else {
        form.reset({
          name: "",
          manufacturer: "",
          itemNumber: "",
          escType: "brushed",
          maxAmps: undefined,
          maxVoltage: "",
          bec: "",
          programmable: false,
          cost: undefined,
          notes: "",
        });
      }
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoRemoved(false);
    }
  }, [open, esc, form]);

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
    mutationFn: async (data: EscFormData) => {
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
      const res = await apiRequest("POST", "/api/electronics/escs", { ...data, photoId });
      return res.json();
    },
    onSuccess: (newEsc: Esc) => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/escs"] });
      toast({ title: "ESC added successfully" });
      onOpenChange(false);
      if (onSuccess) onSuccess(newEsc);
    },
    onError: (error: Error) => {
      setIsUploadingPhoto(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EscFormData) => {
      let photoId: number | null | undefined = esc?.photoId ?? undefined;
      
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
      
      const res = await apiRequest("PUT", `/api/electronics/escs/${esc?.id}`, { ...data, photoId });
      return res.json();
    },
    onSuccess: (updatedEsc: Esc) => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/escs"] });
      toast({ title: "ESC updated successfully" });
      onOpenChange(false);
      if (onSuccess) onSuccess(updatedEsc);
    },
    onError: (error: Error) => {
      setIsUploadingPhoto(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: EscFormData) => {
    if (esc) {
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
            <Gauge className="h-5 w-5" />
            {esc ? "Edit ESC" : "Add ESC"}
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
              <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder="e.g., Hobbywing Quicrun 1060" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="manufacturer" render={({ field }) => (
                <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input {...field} placeholder="e.g., Hobbywing" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="itemNumber" render={({ field }) => (
                <FormItem><FormLabel>Item Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="escType" render={({ field }) => (
              <FormItem><FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="brushed">Brushed</SelectItem>
                    <SelectItem value="brushless">Brushless</SelectItem>
                    <SelectItem value="sensored">Sensored</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="maxAmps" render={({ field }) => (
                <FormItem><FormLabel>Max Amps</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g., 60" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="maxVoltage" render={({ field }) => (
                <FormItem><FormLabel>Max Voltage</FormLabel><FormControl><Input {...field} placeholder="e.g., 3S" /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="bec" render={({ field }) => (
                <FormItem><FormLabel>BEC Output</FormLabel><FormControl><Input {...field} placeholder="e.g., 6V/3A" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="programmable" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Programmable</FormLabel>
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
              {isPending ? "Saving..." : (esc ? "Update ESC" : "Add ESC")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
