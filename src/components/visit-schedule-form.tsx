"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const visitFormSchema = z.object({
  visitorName: z.string().min(2, "Name must be at least 2 characters"),
  visitorEmail: z.string().email("Please enter a valid email address"),
  visitorPhone: z.string().min(1, "Phone number is required"),
  visitDate: z.date({ required_error: "Please select a date" }),
  notes: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

interface VisitScheduleFormProps {
  propertyId: string;
  agentId: string;
}

export function VisitScheduleForm({
  propertyId,
  agentId,
}: VisitScheduleFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      visitorName: "",
      visitorEmail: "",
      visitorPhone: "",
      visitDate: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: VisitFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        visitorName: data.visitorName,
        visitorEmail: data.visitorEmail,
        visitorPhone: data.visitorPhone,
        visitDate: data.visitDate.toISOString(),
        notes: data.notes ?? null,
        propertyId,
        agentId,
        status: "SCHEDULED",
      };

      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to schedule visit");
      }

      toast.success(
        "Visit scheduled successfully! The agent will confirm your appointment."
      );
      form.reset();
    } catch (error: any) {
      toast.error(
        error.message ?? "Failed to schedule visit. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Disable past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="visitorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="visitorEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone */}
          <FormField
            control={form.control}
            name="visitorPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preferred Date */}
          <FormField
            control={form.control}
            name="visitDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Date *</FormLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-10 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < today}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requests or questions..."
                  className="min-h-[80px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto text-white hover:opacity-90"
          style={{ backgroundColor: "#2E8B57" }}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule Visit
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
