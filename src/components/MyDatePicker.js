import React, { useState, useRef, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { TextField, Checkbox, FormControlLabel } from '@mui/material';
import { DateTime } from 'luxon';
import * as utils from "../utils.js";
import "./MyDatePicker.css";
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";

export default function MyDatePicker({ name, label, date, time, onChange, useTime }) {
    //const isMidnight = (dt) => dt !== null && dt.hour === 0 && dt.minute === 0 && dt.second === 0 && dt.millisecond === 0;
    let name_ = name;
    let dateName = `${name_}`;
    let timeName = `${name_}`;

    if(name.endsWith("At")) {
        name_ = name.replace("At", "");
        dateName = `${name_}At`;
        timeName = `${name_}Time`;
    }

    date = utils.toDateTime(date);
    time = utils.toDateTime(time);

    const [startingTime, setTime] = useState(time);
    const [startingDate, setDate] = useState(date);

    const handleDateChange = (newDate, newTime) => {
        const changeValues = {};

        newDate = newDate ? newDate.setZone(utils.getHotelTimezone(), { keepLocalTime: true }) : null;
        newTime = newTime ? newTime.setZone(utils.getHotelTimezone(), { keepLocalTime: true }) : null;

        if(!newDate) {
            newTime = null;
        } else if(newDate && !newTime) {
            newDate = newDate.set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            });
        } else if(newDate && newTime) {
            newDate = newDate.set({
                hour: newTime.hour,
                minute: newTime.minute,
                second: newTime.second,
                millisecond: newTime.millisecond,
            });

            newTime = newTime.set({
                year : newDate.year,
                month : newDate.month,
                day : newDate.day,
            });
        }

        setDate(newDate);
        setTime(newTime);

        changeValues[dateName] = newDate;
        changeValues[timeName] = newTime;
        onChange("_batch", changeValues); 
    };

    const onHandleSetNow = async() => {
        handleDateChange(utils.now(), utils.now());
    }

    const slotProps = {
        textField: { fullWidth: true },
        //popper: {sx: { zIndex: 10001,},},
    };

    const dateLabel = label ? `${label} date` : "date";
    const timeLabel = label ? `${label} time` : "time";

    return (
        <div className="date-time-input">
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", marginTop: "1rem" }}>
                <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale="en-gb">
                    <MobileDateTimePicker
                        slotProps={slotProps}  
                        label={`Select ${dateLabel}`}
                        value={date}
                        format="dd/MM/yyyy"
                        onChange={(newDate) => handleDateChange(newDate, startingTime)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        ampm={false}
                        views={["year", "month", "day"]}
                    />
                </LocalizationProvider>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "start", marginTop: "0.1rem" }}>
                    <button
                        onClick={() => handleDateChange(utils.today(), startingTime)}
                        style={{marginLeft: "1rem", padding:"0.5rem", width: 'fit-content'}}>
                            Today
                    </button>
                    <button 
                        onClick={() => handleDateChange(utils.today(1), startingTime)}
                        style={{marginLeft: "1rem", padding:"0.5rem", width: 'fit-content'}}>
                            Tomorrow
                    </button>
                </div>
            </div>

            {useTime !== false && (
                <div style={{display:"flex", flexDirection: "column", alignItems: "center",marginTop:"1rem"}}>
                    <div className="time-input" />
                    <LocalizationProvider dateAdapter={AdapterLuxon}>
                        <MobileTimePicker
                            label={`Select ${timeLabel}`}
                            value={startingTime}
                            onChange={(newTime) => handleDateChange(startingDate, newTime)}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                            ampm={false}
                            views={["hours", "minutes"]}
                            desktopModeMediaQuery="(max-width: 999999px)" // force modal mode
                            slotProps={slotProps} 
                        />
                    </LocalizationProvider>
                    <div style={{display:"flex", flexDirection: "row", alignItems: "left",marginTop:"0.1rem"}}>
                        {(utils.isToday(startingDate) || !startingDate) && (<>
                            <button 
                                onClick={onHandleSetNow}
                                style={{marginLeft: "1rem", padding:"0.3rem", width: 'fit-content'}}>
                                    Now
                            </button>
                        </>)}
                        <button 
                            onClick={() => handleDateChange(startingDate, null)}
                            style={{marginLeft: "1rem", padding:"0.3rem", width: 'fit-content'}}>
                                TBD
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
