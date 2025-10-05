import React from "react";
import { NotificationProvider } from "../context/NotificationContext";
import { FilterProvider } from "../context/FilterContext";
import { MenuProvider } from '../context/MenuContext';

export function AppProviders({ children }) {
  return (
    <NotificationProvider>
    <FilterProvider>
    <MenuProvider>
        {children}
    </MenuProvider>
    </FilterProvider>
    </NotificationProvider>
  );
}
