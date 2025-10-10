import React from "react";
import { NotificationProvider } from "../context/NotificationContext";
import { FilterProvider } from "../context/FilterContext";
import { MenuProvider } from '../context/MenuContext';
import { MarkDownProvider } from '../context/MarkDownContext';
import { ItemsCounterProvider } from "../context/ItemsCounterContext";
import { SuccessNotificationProvider } from "../context/SuccessContext";

export function AppProviders({ children }) {
  return (
    <SuccessNotificationProvider>
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
    </SuccessNotificationProvider>
  );
}
