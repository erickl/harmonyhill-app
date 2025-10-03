import React, { useState, useRef, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import { DateTime } from 'luxon';
import * as utils from "../utils";
import "./MyDatePicker.css";
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";

export default function MyDatePicker({ name, date, time, onChange, useTime }) {
    //const isMidnight = (dt) => dt !== null && dt.hour === 0 && dt.minute === 0 && dt.second === 0 && dt.millisecond === 0;

    date = utils.toDateTime(date);
    time = utils.toDateTime(time);

    const [startingTime, setTime] = useState(time);
    const [startingDate, setDate] = useState(date);

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

        setDate(newStartingDate);
        setTime(newTimeCopy);

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

            setDate(newDateCopy);
            onChange(name, newDateCopy);
        }
    };

    return (
        <div className="date-time-input">
            <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale="en-gb">
                <MobileDateTimePicker
                    slotProps={{
                        textField: { fullWidth: true }
                    }}  
                    label="Select a date"
                    value={date}
                    format="dd/MM/yyyy"
                    onChange={(newDate) => handleDateChange(newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    ampm={false}
                    views={["year", "month", "day"]}
                />
            </LocalizationProvider>

            {useTime !== false && (<>
                <div className="time-input" />
                <LocalizationProvider dateAdapter={AdapterLuxon}>
                    <MobileTimePicker
                        label="Select a time"
                        value={startingTime}
                        onChange={(newTime) => handleTimeChange(newTime)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        ampm={false}
                        views={["hours", "minutes"]}
                        desktopModeMediaQuery="(max-width: 999999px)" // force modal mode
                        slotProps={{
                            textField: { fullWidth: true }
                        }}  
                    />
                </LocalizationProvider>
            </>)}
        </div>
    );
}
