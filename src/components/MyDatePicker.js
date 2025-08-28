import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import { DateTime } from 'luxon';
import { Utensils } from 'lucide-react';
import * as utils from "../utils";

export default function MyDatePicker({ name, date, time, onChange }) {
    //const isMidnight = (dt) => dt !== null && dt.hour === 0 && dt.minute === 0 && dt.second === 0 && dt.millisecond === 0;

    const [startingTime, setStartingTime] = useState(time);
    const [startingDate, setStartingDate] = useState(date);

    const handleTimeChange = (newTime) => {
        const newTimeCopy = newTime.setZone(utils.getHotelTimezone(), { keepLocalTime: true });
        let newStartingDate = startingDate;

        if (newTime && startingDate) {
            newStartingDate = newStartingDate.set({
                hour: newTimeCopy.hour,
                minute: newTimeCopy.minute,
                second: newTimeCopy.second,
                millisecond: newTimeCopy.millisecond,
            });
        }

        setStartingDate(newStartingDate);
        setStartingTime(newTimeCopy);

        onChange("_batch", {
            [name]: newStartingDate,
            "startingTime": newTimeCopy
        });
    }

    const handleDateChange = (newDate) => {
        if (newDate) {
            let newDateCopy = newDate.setZone(utils.getHotelTimezone(), { keepLocalTime: true });
            if (startingTime) {
                newDateCopy = newDateCopy.set({
                    hour: startingTime.hour,
                    minute: startingTime.minute,
                    second: startingTime.second,
                    millisecond: startingTime.millisecond,
                });
            }

            setStartingDate(newDateCopy);
            onChange(name, newDateCopy);
        }
    };

    return ( <>
        <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale="en-gb">
            <DateTimePicker
                label="Select a date"
                value={date}
                format="dd/MM/yyyy"
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
                ampm={false}
                views={['year', 'month', 'day']}
            />
        </LocalizationProvider>
        
        {time && (
            <LocalizationProvider dateAdapter={AdapterLuxon}>
                <TimePicker
                    label="Select a time"
                    value={startingTime}
                    onChange={handleTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    ampm={false}
                    views={['hours', 'minutes']}
                />
            </LocalizationProvider>
        )}
    </>);
}
