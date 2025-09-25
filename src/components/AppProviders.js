import React from "react";
import { NotificationProvider } from "../context/NotificationContext";

export function AppProviders({ children }) {
  return (
    <NotificationProvider>
        {children}
    </NotificationProvider>
  );
}
