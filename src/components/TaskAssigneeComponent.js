import React, { useState, useEffect } from 'react';
import { useUserPermissions } from '../context/UserPermissionsContext.js';
import "./TaskAssigneeComponent.css";
import * as utils from "../utils.js";

const assigneeStyles = [
    { backgroundColor: "#E12C2C", color: "white" },
    { backgroundColor: "#FFA500", color: "black" },
    { backgroundColor: "green",     color: "white" }
];

export default function TaskAssigneeComponent({initialAssigneeName, initialAssigneeAccept, initialHasChanged}) {
    const [assigneeName, setAssigneeName] = useState(initialAssigneeName);
    const [assigneeAccept, setAssigneeAccept] = useState(initialAssigneeAccept);
    const [hasChanged, setHasChanged] = useState(initialHasChanged);
    const [assigneeStyle, setAssigneeStyle] = useState(assigneeStyles[0]);

    const {users} = useUserPermissions();

    const assignedUser = users ? users.find(user => user.name === assigneeName) : null;
    const assignedUserShortName = assignedUser ? assignedUser.shortName : "?";

    const getAssigneeStyleIndex = (localAssigneeName, localAssigneeAccept) => {
        let newAssigneeStyleIndex = 0;
        if (localAssigneeName !== "?" && !utils.isEmpty(localAssigneeName)) {
            newAssigneeStyleIndex = 1;
            if (localAssigneeAccept) {
                newAssigneeStyleIndex = 2;
            }
        }

        return newAssigneeStyleIndex;
    };

    useEffect(() => {
        setAssigneeName(initialAssigneeName);
        setAssigneeAccept(initialAssigneeAccept);
        setHasChanged(initialHasChanged);

        const assigneeStyleIndex_ = getAssigneeStyleIndex(initialAssigneeName, initialAssigneeAccept);
        const assigneeStyle_ = assigneeStyles[assigneeStyleIndex_];
        setAssigneeStyle(assigneeStyle_);

        // Blinking effect on staff assign component, for when their attention is needed, as they need to re-confirm
        let timerId = null;
        if (initialHasChanged) {
            const toggleColor = () => {
                setAssigneeStyle(prevIndex => prevIndex === assigneeStyles[1] ? assigneeStyles[2] : assigneeStyles[1]);
            };

            timerId = setInterval(toggleColor, 500);
        }

        return () => {
            if (timerId) clearInterval(timerId);
        }
    }, [initialAssigneeAccept, initialHasChanged, initialAssigneeName]);
    
    return (
        <div className="main-component" style={assigneeStyle}>
            {assignedUserShortName}
        </div>
    );
}