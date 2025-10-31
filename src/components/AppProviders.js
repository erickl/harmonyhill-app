import React from "react";
import { NotificationProvider } from "../context/NotificationContext.js";
import { FilterProvider } from "../context/FilterContext.js";
import { MenuProvider } from '../context/MenuContext.js';
import { MarkDownProvider } from '../context/MarkDownContext.js';
import { ItemsCounterProvider } from "../context/ItemsCounterContext.js";
import { SuccessNotificationProvider } from "../context/SuccessContext.js";
import { ConfirmationProvider } from "../context/ConfirmationContext.js";
import { CameraProvider } from "../context/CameraContext.js";
import { ImageCarouselProvider } from "../context/ImageCarouselContext.js";

export function AppProviders({ children }) {
  return (
    <SuccessNotificationProvider>
    <NotificationProvider>
    <ConfirmationProvider>
    <FilterProvider>
    <MenuProvider>
    <MarkDownProvider>
    <ItemsCounterProvider>
    <CameraProvider>
    <ImageCarouselProvider>
      {children}
    </ImageCarouselProvider>
    </CameraProvider>
    </ItemsCounterProvider>
    </MarkDownProvider>
    </MenuProvider>
    </FilterProvider>
    </ConfirmationProvider>
    </NotificationProvider>
    </SuccessNotificationProvider>
  );
}
