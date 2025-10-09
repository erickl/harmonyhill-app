import React from "react";
import { NotificationProvider } from "../context/NotificationContext";
import { FilterProvider } from "../context/FilterContext";
import { MenuProvider } from '../context/MenuContext';
import { MarkDownProvider } from '../context/MarkDownContext';
import { ItemsCounterProvider } from "../context/ItemsCounterContext";

export function AppProviders({ children }) {
  return (
    <NotificationProvider>
    <FilterProvider>
    <MenuProvider>
    <MarkDownProvider>
    <ItemsCounterProvider>
        {children}
    </ItemsCounterProvider>
    </MarkDownProvider>
    </MenuProvider>
    </FilterProvider>
    </NotificationProvider>
  );
}
