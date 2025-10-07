import React from "react";
import { NotificationProvider } from "../context/NotificationContext";
import { FilterProvider } from "../context/FilterContext";
import { MenuProvider } from '../context/MenuContext';
import { MarkDownProvider } from '../context/MarkDownContext';

export function AppProviders({ children }) {
  return (
    <NotificationProvider>
    <FilterProvider>
    <MenuProvider>
    <MarkDownProvider>
        {children}
    </MarkDownProvider>
    </MenuProvider>
    </FilterProvider>
    </NotificationProvider>
  );
}
