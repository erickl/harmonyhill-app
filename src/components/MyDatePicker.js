import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TextField } from '@mui/material';
import { DateTime } from 'luxon';
import { Utensils } from 'lucide-react';
import * as utils from "../utils";

export default function MyDatePicker({ name, value, onChange }) {
  const handleChange = (newValue) => {
    if (newValue) {
      const dateTime = newValue.setZone(utils.getHotelTimezone(), { keepLocalTime: true });
      onChange(name, dateTime);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <DateTimePicker
        label="Select a date"
        value={value}
        onChange={handleChange}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </LocalizationProvider>
  );
}
