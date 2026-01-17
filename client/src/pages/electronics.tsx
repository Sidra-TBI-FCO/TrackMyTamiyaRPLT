import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Radio, Settings2, Gauge, Plus, Pencil, Trash2, Search, DollarSign, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Motor, Esc, Servo, Receiver } from "@shared/schema";
import { MotorDialog, EscDialog, ServoDialog, ReceiverDialog } from "@/components/electronics";

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
