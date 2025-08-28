"use client"

import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"

import { cn } from "@/lib/utils"

function NavigationMenu({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative z-50 flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    />
  )
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center gap-2", className)}
      {...props}
    />
  )
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={className} {...props} />
  )
}

function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-9 px-4",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuTrigger({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-9 px-4 gap-1",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "left-0 top-full absolute w-auto min-w-[12rem] rounded-md border bg-popover p-2 shadow-md",
        className
      )}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
}


