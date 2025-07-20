import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { insertModelSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTamiyaScraper } from "@/hooks/use-tamiya-scraper";
import { z } from "zod";

const formSchema = insertModelSchema.extend({
  itemNumber: z.string().min(1, "Item number is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddModelDialogProps {
  trigger?: React.ReactNode;
}

export default function AddModelDialog({ trigger }: AddModelDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { scrapeModelData, isLoading: isScraping } = useTamiyaScraper();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      itemNumber: "",
      chassis: "",
      releaseYear: undefined,
      buildStatus: "planning",
      totalCost: "0",
      notes: "",
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/models", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Model added successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleItemNumberBlur = async () => {
    const itemNumber = form.getValues("itemNumber");
    if (itemNumber && !form.getValues("name")) {
      try {
        const scrapedData = await scrapeModelData(itemNumber);
        if (scrapedData) {
          form.setValue("name", scrapedData.name);
          if (scrapedData.chassis) form.setValue("chassis", scrapedData.chassis);
          if (scrapedData.releaseYear) form.setValue("releaseYear", scrapedData.releaseYear);
        }
      } catch (error) {
        // Silently fail - user can still enter data manually
      }
    }
  };

  const onSubmit = (data: FormData) => {
    createModelMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-red-600 hover:bg-red-700 text-white font-mono">
            <Plus className="mr-2 h-4 w-4" />
            Add New Model
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Add New Tamiya Model</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Item Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 58679"
                      className="font-mono"
                      onBlur={handleItemNumberBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Model Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. TT-02 Subaru BRZ"
                      className="font-mono"
                      disabled={isScraping}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chassis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Chassis</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. TT-02"
                      className="font-mono"
                      disabled={isScraping}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buildStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Build Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="built">Built</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Total Cost</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about this model..."
                      className="font-mono"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createModelMutation.isPending || isScraping}
                className="bg-red-600 hover:bg-red-700 font-mono"
              >
                {createModelMutation.isPending || isScraping ? "Adding..." : "Add Model"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
