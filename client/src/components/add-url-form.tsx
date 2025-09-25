import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUrlSchema, type InsertUrl } from "@shared/schema";

interface AddUrlFormProps {
  onUrlAdded: () => void;
}

export default function AddUrlForm({ onUrlAdded }: AddUrlFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertUrl>({
    resolver: zodResolver(insertUrlSchema),
    defaultValues: {
      url: "",
      name: "",
    },
  });

  const addUrlMutation = useMutation({
    mutationFn: async (data: InsertUrl) => {
      const response = await apiRequest("POST", "/api/urls", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "URL added successfully",
      });
      form.reset();
      onUrlAdded();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add URL",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUrl) => {
    addUrlMutation.mutate(data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-primary w-4 h-4" />
          <h2 className="text-lg font-semibold">Add New URL</h2>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="url-input" className="block text-sm font-medium text-foreground mb-2">
              Website URL
            </Label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com"
              {...form.register("url")}
              data-testid="input-url"
            />
            {form.formState.errors.url && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="name-input" className="block text-sm font-medium text-foreground mb-2">
              Display Name (Optional)
            </Label>
            <Input
              id="name-input"
              type="text"
              placeholder="My Website"
              {...form.register("name")}
              data-testid="input-name"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={addUrlMutation.isPending}
            data-testid="button-add-url"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addUrlMutation.isPending ? "Adding..." : "Add URL"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
