"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DateTimePicker({ 
  date, 
  setDate, 
  disabled = false,
  placeholder = "Choisir une date et heure"
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Generate 24 hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // Generate minutes in 5-minute intervals
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // If we have an existing date, preserve the time
      if (date) {
        selectedDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      } else {
        // Default to current time
        const now = new Date();
        selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", value: number) => {
    if (date) {
      const newDate = new Date(date);
      if (type === "hour") {
        newDate.setHours(value);
      } else if (type === "minute") {
        newDate.setMinutes(value);
      }
      setDate(newDate);
    } else {
      // If no date selected, use today with the selected time
      const newDate = new Date();
      if (type === "hour") {
        newDate.setHours(value, 0, 0, 0);
      } else if (type === "minute") {
        newDate.setMinutes(value);
      }
      setDate(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={fr}
            weekStartsOn={1}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            {/* Hours */}
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      date && date.getHours() === hour
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("hour", hour)}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            
            {/* Minutes */}
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      date && date.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("minute", minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}