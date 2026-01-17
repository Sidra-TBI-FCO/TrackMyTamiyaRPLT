import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Radio, Settings2, Gauge, Plus, Pencil, Trash2, Search, DollarSign, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Motor, Esc, Servo, Receiver } from "@shared/schema";

const motorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  itemNumber: z.string().optional(),
  motorType: z.enum(["brushed", "brushless"]),
  isSensored: z.boolean().optional(),
  kv: z.coerce.number().optional(),
  turns: z.coerce.number().optional(),
  diameter: z.string().optional(),
  canSize: z.string().optional(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const escFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  itemNumber: z.string().optional(),
  escType: z.enum(["brushed", "brushless", "sensored"]),
  maxAmps: z.coerce.number().optional(),
  maxVoltage: z.string().optional(),
  bec: z.string().optional(),
  programmable: z.boolean().optional(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

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
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const receiverFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  itemNumber: z.string().optional(),
  protocol: z.string().optional(),
  channels: z.coerce.number().optional(),
  frequency: z.string().optional(),
  hasGyro: z.boolean().optional(),
  hasTelemetry: z.boolean().optional(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type MotorFormData = z.infer<typeof motorFormSchema>;
type EscFormData = z.infer<typeof escFormSchema>;
type ServoFormData = z.infer<typeof servoFormSchema>;
type ReceiverFormData = z.infer<typeof receiverFormSchema>;

function MotorDialog({ motor, open, onOpenChange }: { motor?: Motor; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<MotorFormData>({
    resolver: zodResolver(motorFormSchema),
    defaultValues: {
      name: motor?.name || "",
      manufacturer: motor?.manufacturer || "",
      itemNumber: motor?.itemNumber || "",
      motorType: (motor?.motorType as "brushed" | "brushless") || "brushed",
      isSensored: motor?.isSensored || false,
      kv: motor?.kv || undefined,
      turns: motor?.turns || undefined,
      diameter: motor?.diameter || "",
      canSize: motor?.canSize || "",
      cost: motor?.cost ? parseFloat(motor.cost) : undefined,
      notes: motor?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MotorFormData) => apiRequest("POST", "/api/electronics/motors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/motors"] });
      toast({ title: "Motor added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: MotorFormData) => apiRequest("PUT", `/api/electronics/motors/${motor?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/motors"] });
      toast({ title: "Motor updated successfully" });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (data: MotorFormData) => {
    if (motor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{motor ? "Edit Motor" : "Add Motor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormItem><FormLabel>KV Rating</FormLabel><FormControl><Input type="number" {...field} placeholder="e.g., 3000" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="turns" render={({ field }) => (
                <FormItem><FormLabel>Turns</FormLabel><FormControl><Input type="number" {...field} placeholder="e.g., 17" /></FormControl></FormItem>
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
              <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} placeholder="Additional notes..." /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {motor ? "Update Motor" : "Add Motor"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EscDialog({ esc, open, onOpenChange }: { esc?: Esc; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<EscFormData>({
    resolver: zodResolver(escFormSchema),
    defaultValues: {
      name: esc?.name || "",
      manufacturer: esc?.manufacturer || "",
      itemNumber: esc?.itemNumber || "",
      escType: (esc?.escType as "brushed" | "brushless" | "sensored") || "brushed",
      maxAmps: esc?.maxAmps || undefined,
      maxVoltage: esc?.maxVoltage || "",
      bec: esc?.bec || "",
      programmable: esc?.programmable || false,
      cost: esc?.cost ? parseFloat(esc.cost) : undefined,
      notes: esc?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EscFormData) => apiRequest("POST", "/api/electronics/escs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/escs"] });
      toast({ title: "ESC added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: EscFormData) => apiRequest("PUT", `/api/electronics/escs/${esc?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/escs"] });
      toast({ title: "ESC updated successfully" });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (data: EscFormData) => {
    if (esc) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{esc ? "Edit ESC" : "Add ESC"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormItem><FormLabel>Max Amps</FormLabel><FormControl><Input type="number" {...field} placeholder="e.g., 60" /></FormControl></FormItem>
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
              <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {esc ? "Update ESC" : "Add ESC"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ServoDialog({ servo, open, onOpenChange }: { servo?: Servo; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<ServoFormData>({
    resolver: zodResolver(servoFormSchema),
    defaultValues: {
      name: servo?.name || "",
      manufacturer: servo?.manufacturer || "",
      itemNumber: servo?.itemNumber || "",
      servoType: (servo?.servoType as "standard" | "low-profile" | "mini" | "micro") || "standard",
      torque: servo?.torque || "",
      speed: servo?.speed || "",
      voltage: servo?.voltage || "",
      gearType: servo?.gearType as "plastic" | "metal" | "titanium" | undefined,
      isDigital: servo?.isDigital || false,
      isWaterproof: servo?.isWaterproof || false,
      cost: servo?.cost ? parseFloat(servo.cost) : undefined,
      notes: servo?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ServoFormData) => apiRequest("POST", "/api/electronics/servos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/servos"] });
      toast({ title: "Servo added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ServoFormData) => apiRequest("PUT", `/api/electronics/servos/${servo?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/servos"] });
      toast({ title: "Servo updated successfully" });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (data: ServoFormData) => {
    if (servo) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{servo ? "Edit Servo" : "Add Servo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField control={form.control} name="servoType" render={({ field }) => (
              <FormItem><FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="torque" render={({ field }) => (
                <FormItem><FormLabel>Torque</FormLabel><FormControl><Input {...field} placeholder="e.g., 12kg-cm" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="speed" render={({ field }) => (
                <FormItem><FormLabel>Speed</FormLabel><FormControl><Input {...field} placeholder="e.g., 0.08s/60°" /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="voltage" render={({ field }) => (
                <FormItem><FormLabel>Voltage</FormLabel><FormControl><Input {...field} placeholder="e.g., 4.8V-7.4V" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="gearType" render={({ field }) => (
                <FormItem><FormLabel>Gear Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {servo ? "Update Servo" : "Add Servo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ReceiverDialog({ receiver, open, onOpenChange }: { receiver?: Receiver; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<ReceiverFormData>({
    resolver: zodResolver(receiverFormSchema),
    defaultValues: {
      name: receiver?.name || "",
      manufacturer: receiver?.manufacturer || "",
      itemNumber: receiver?.itemNumber || "",
      protocol: receiver?.protocol || "",
      channels: receiver?.channels || undefined,
      frequency: receiver?.frequency || "",
      hasGyro: receiver?.hasGyro || false,
      hasTelemetry: receiver?.hasTelemetry || false,
      cost: receiver?.cost ? parseFloat(receiver.cost) : undefined,
      notes: receiver?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ReceiverFormData) => apiRequest("POST", "/api/electronics/receivers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/receivers"] });
      toast({ title: "Receiver added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ReceiverFormData) => apiRequest("PUT", `/api/electronics/receivers/${receiver?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/receivers"] });
      toast({ title: "Receiver updated successfully" });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (data: ReceiverFormData) => {
    if (receiver) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{receiver ? "Edit Receiver" : "Add Receiver"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder="e.g., Futaba R334SBS" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="manufacturer" render={({ field }) => (
                <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input {...field} placeholder="e.g., Futaba" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="itemNumber" render={({ field }) => (
                <FormItem><FormLabel>Item Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="protocol" render={({ field }) => (
                <FormItem><FormLabel>Protocol</FormLabel><FormControl><Input {...field} placeholder="e.g., FHSS" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="channels" render={({ field }) => (
                <FormItem><FormLabel>Channels</FormLabel><FormControl><Input type="number" {...field} placeholder="e.g., 4" /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="frequency" render={({ field }) => (
              <FormItem><FormLabel>Frequency</FormLabel><FormControl><Input {...field} placeholder="e.g., 2.4GHz" /></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="hasGyro" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Built-in Gyro</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="hasTelemetry" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Telemetry</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="cost" render={({ field }) => (
              <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {receiver ? "Update Receiver" : "Add Receiver"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Electronics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [motorDialogOpen, setMotorDialogOpen] = useState(false);
  const [escDialogOpen, setEscDialogOpen] = useState(false);
  const [servoDialogOpen, setServoDialogOpen] = useState(false);
  const [receiverDialogOpen, setReceiverDialogOpen] = useState(false);
  const [editingMotor, setEditingMotor] = useState<Motor | undefined>();
  const [editingEsc, setEditingEsc] = useState<Esc | undefined>();
  const [editingServo, setEditingServo] = useState<Servo | undefined>();
  const [editingReceiver, setEditingReceiver] = useState<Receiver | undefined>();

  const { toast } = useToast();

  const { data: motors = [], isLoading: motorsLoading } = useQuery<Motor[]>({ queryKey: ["/api/electronics/motors"] });
  const { data: escs = [], isLoading: escsLoading } = useQuery<Esc[]>({ queryKey: ["/api/electronics/escs"] });
  const { data: servos = [], isLoading: servosLoading } = useQuery<Servo[]>({ queryKey: ["/api/electronics/servos"] });
  const { data: receivers = [], isLoading: receiversLoading } = useQuery<Receiver[]>({ queryKey: ["/api/electronics/receivers"] });

  const deleteMotor = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/electronics/motors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/motors"] });
      toast({ title: "Motor deleted" });
    },
  });

  const deleteEsc = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/electronics/escs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/escs"] });
      toast({ title: "ESC deleted" });
    },
  });

  const deleteServo = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/electronics/servos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/servos"] });
      toast({ title: "Servo deleted" });
    },
  });

  const deleteReceiver = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/electronics/receivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electronics/receivers"] });
      toast({ title: "Receiver deleted" });
    },
  });

  const totalItems = motors.length + escs.length + servos.length + receivers.length;
  const totalValue = [...motors, ...escs, ...servos, ...receivers].reduce((sum, item) => {
    const cost = item.cost ? parseFloat(item.cost) : 0;
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  const filterItems = <T extends { name: string; manufacturer?: string | null }>(items: T[]) =>
    items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

  const isLoading = motorsLoading || escsLoading || servosLoading || receiversLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">Electronics</h1>
          <p className="text-gray-600 dark:text-gray-400 font-mono">Manage your motors, ESCs, servos, and receivers</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{totalItems}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{motors.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Motors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{escs.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">ESCs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">${totalValue.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search electronics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 font-mono"
        />
      </div>

      <Tabs defaultValue="motors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="motors" className="font-mono"><Zap className="h-4 w-4 mr-2" />Motors ({motors.length})</TabsTrigger>
          <TabsTrigger value="escs" className="font-mono"><Gauge className="h-4 w-4 mr-2" />ESCs ({escs.length})</TabsTrigger>
          <TabsTrigger value="servos" className="font-mono"><Settings2 className="h-4 w-4 mr-2" />Servos ({servos.length})</TabsTrigger>
          <TabsTrigger value="receivers" className="font-mono"><Radio className="h-4 w-4 mr-2" />Receivers ({receivers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="motors" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingMotor(undefined); setMotorDialogOpen(true); }} className="font-mono">
              <Plus className="h-4 w-4 mr-2" />Add Motor
            </Button>
          </div>
          {filterItems(motors).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500 font-mono">No motors found</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItems(motors).map((motor) => (
                <Card key={motor.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-mono text-lg">{motor.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMotor(motor); setMotorDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this motor?")) deleteMotor.mutate(motor.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {motor.manufacturer && <p className="text-sm text-gray-600 dark:text-gray-400">{motor.manufacturer}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{motor.motorType}</Badge>
                      {motor.isSensored && <Badge variant="outline">Sensored</Badge>}
                      {motor.kv && <Badge variant="outline">{motor.kv} KV</Badge>}
                      {motor.turns && <Badge variant="outline">{motor.turns}T</Badge>}
                      {motor.diameter && <Badge variant="outline">{motor.diameter}</Badge>}
                    </div>
                    {motor.cost && <p className="text-sm font-mono text-green-600">${parseFloat(motor.cost).toFixed(2)}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="escs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingEsc(undefined); setEscDialogOpen(true); }} className="font-mono">
              <Plus className="h-4 w-4 mr-2" />Add ESC
            </Button>
          </div>
          {filterItems(escs).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500 font-mono">No ESCs found</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItems(escs).map((esc) => (
                <Card key={esc.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-mono text-lg">{esc.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingEsc(esc); setEscDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this ESC?")) deleteEsc.mutate(esc.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {esc.manufacturer && <p className="text-sm text-gray-600 dark:text-gray-400">{esc.manufacturer}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{esc.escType}</Badge>
                      {esc.maxAmps && <Badge variant="outline">{esc.maxAmps}A</Badge>}
                      {esc.maxVoltage && <Badge variant="outline">{esc.maxVoltage}</Badge>}
                      {esc.programmable && <Badge variant="outline">Programmable</Badge>}
                    </div>
                    {esc.bec && <p className="text-xs text-gray-500">BEC: {esc.bec}</p>}
                    {esc.cost && <p className="text-sm font-mono text-green-600">${parseFloat(esc.cost).toFixed(2)}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="servos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingServo(undefined); setServoDialogOpen(true); }} className="font-mono">
              <Plus className="h-4 w-4 mr-2" />Add Servo
            </Button>
          </div>
          {filterItems(servos).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500 font-mono">No servos found</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItems(servos).map((servo) => (
                <Card key={servo.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-mono text-lg">{servo.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingServo(servo); setServoDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this servo?")) deleteServo.mutate(servo.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {servo.manufacturer && <p className="text-sm text-gray-600 dark:text-gray-400">{servo.manufacturer}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{servo.servoType}</Badge>
                      {servo.isDigital && <Badge variant="outline">Digital</Badge>}
                      {servo.isWaterproof && <Badge variant="outline">Waterproof</Badge>}
                      {servo.gearType && <Badge variant="outline">{servo.gearType}</Badge>}
                    </div>
                    {servo.torque && <p className="text-xs text-gray-500">Torque: {servo.torque}</p>}
                    {servo.speed && <p className="text-xs text-gray-500">Speed: {servo.speed}</p>}
                    {servo.cost && <p className="text-sm font-mono text-green-600">${parseFloat(servo.cost).toFixed(2)}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="receivers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingReceiver(undefined); setReceiverDialogOpen(true); }} className="font-mono">
              <Plus className="h-4 w-4 mr-2" />Add Receiver
            </Button>
          </div>
          {filterItems(receivers).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500 font-mono">No receivers found</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItems(receivers).map((receiver) => (
                <Card key={receiver.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-mono text-lg">{receiver.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingReceiver(receiver); setReceiverDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this receiver?")) deleteReceiver.mutate(receiver.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {receiver.manufacturer && <p className="text-sm text-gray-600 dark:text-gray-400">{receiver.manufacturer}</p>}
                    <div className="flex flex-wrap gap-2">
                      {receiver.protocol && <Badge variant="secondary">{receiver.protocol}</Badge>}
                      {receiver.channels && <Badge variant="outline">{receiver.channels}CH</Badge>}
                      {receiver.frequency && <Badge variant="outline">{receiver.frequency}</Badge>}
                      {receiver.hasGyro && <Badge variant="outline">Gyro</Badge>}
                      {receiver.hasTelemetry && <Badge variant="outline">Telemetry</Badge>}
                    </div>
                    {receiver.cost && <p className="text-sm font-mono text-green-600">${parseFloat(receiver.cost).toFixed(2)}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MotorDialog key={editingMotor?.id ?? 'new-motor'} motor={editingMotor} open={motorDialogOpen} onOpenChange={setMotorDialogOpen} />
      <EscDialog key={editingEsc?.id ?? 'new-esc'} esc={editingEsc} open={escDialogOpen} onOpenChange={setEscDialogOpen} />
      <ServoDialog key={editingServo?.id ?? 'new-servo'} servo={editingServo} open={servoDialogOpen} onOpenChange={setServoDialogOpen} />
      <ReceiverDialog key={editingReceiver?.id ?? 'new-receiver'} receiver={editingReceiver} open={receiverDialogOpen} onOpenChange={setReceiverDialogOpen} />
    </div>
  );
}
