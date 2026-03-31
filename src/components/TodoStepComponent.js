import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, Plus } from 'lucide-react';
import * as utils from "../utils.js";
import MetaInfo from './MetaInfo.js';
import Spinner from './Spinner.js';
import { useUserPermissions } from "../context/UserPermissionsContext.js";
import "./TodoStepComponent.css";
import { Checkbox, FormControlLabel } from '@mui/material';

export default function TodoStepComponent({todoStep}) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const { permissions } = useUserPermissions();

    const handleSetExpanded = () => {
        setLoading((prev) => !prev);
        setExpanded((prev) => !prev);
        setLoading((prev) => !prev);
    }

    if(!todoStep) return <div></div>;

    return (
        <div className="todo-step-box" onClick={(e) => {
            e.stopPropagation();
            handleSetExpanded();
        }}>
            <div className="todo-step-header">
                <div className="todo-step-header-left">
                    <FormControlLabel
                        sx={{  margin: 0 }}
                        control={
                            <Checkbox
                                checked={completed}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setCompleted(e.target.checked);               
                                }}
                            />
                        }
                        label={todoStep.title}
                    />
                </div>
                <div className="todo-step-header-right">
                    <div>
                        {utils.to_www_ddMMM(todoStep.deadlineAt)}
                    </div>
                    <div className="expand-icon">
                        {expanded ? '▼' : '▶'}
                    </div>
                </div>
            </div>
            {loading === true ? (
                <Spinner />
            ) : expanded ? (
                <div className="todo-step-body">
                    <div>
                        Duration: {todoStep.duration}
                    </div>
                    <div>
                        Deadline: {utils.to_ddMMM(todoStep.deadlineAt)}
                    </div>
                    <div className="todo-body-footer">
                        <div className="todo-body-footer-icon">
                            <Pencil   
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            />
                            <p>Edit</p>
                        </div>
                        
                        <div className="todo-body-footer-icon">
                            <Trash2  
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            />
                            <p>Delete</p>
                        </div>
                    </div>
                <MetaInfo document={todoStep}/>
                </div>
            ) : (<></>)}
        </div>
    );
}
