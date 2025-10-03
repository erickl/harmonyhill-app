import React from "react";
import { NotificationProvider } from "../context/NotificationContext";
import { FilterProvider } from "../context/FilterContext";

export function AppProviders({ children }) {
  return (
    <NotificationProvider>
    <FilterProvider>
        {children}
    </FilterProvider>
    </NotificationProvider>
  );
}
