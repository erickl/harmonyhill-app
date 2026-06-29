import React, { useState, useEffect } from 'react';
import { useUserPermissions } from '../context/UserPermissionsContext.js';
import "./TaskAssigneeComponent.css";

const assigneeStyles = [
    { backgroundColor: "#E12C2C", color: "white" },
    { backgroundColor: "#FFA500", color: "black" },
    { backgroundColor: "green",     color: "white" }
];

export default function TaskAssigneeComponent({assigneeName, assigneeAccept, hasChanged}) {
    const {users} = useUserPermissions();
    const [assigneeStyle, setAssigneeStyle] = useState(assigneeStyles[0]);
    
    const assignedUser = users ? users.find(user => user.name === assigneeName) : null;
    const assignedUserShortName = assignedUser ? assignedUser.shortName : "?";

    const getAssigneeStyleIndex = () => {
        let newAssigneeStyleIndex = 0;
        if (assigneeName !== "?") {
            newAssigneeStyleIndex = 1;
            if (assigneeAccept === true) {
                newAssigneeStyleIndex = 2;
            }
        }

        return newAssigneeStyleIndex;
    };

    useEffect(() => {
        const assigneeStyleIndex_ = getAssigneeStyleIndex();
        const assigneeStyle_ = assigneeStyles[assigneeStyleIndex_];
        setAssigneeStyle(assigneeStyle_);

        // Blinking effect on staff assign component, for when their attention is needed, as they need to re-confirm
        let timerId = null;
        if (hasChanged) {
            const toggleColor = () => {
                setAssigneeStyle(prevIndex => prevIndex === assigneeStyles[1] ? assigneeStyles[2] : assigneeStyles[1]);
            };

            timerId = setInterval(toggleColor, 500);
        }

        return () => {
            if (timerId) clearInterval(timerId);
        }
    }, [assigneeAccept, hasChanged, assigneeName]);
    
    return (
        <div className="main-component" style={assigneeStyle}>
            {assignedUserShortName}
        </div>
    );
}