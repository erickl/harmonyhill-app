import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import "./ChangeLogsComponent.css";
import * as logsService from "../services/logsService.js";
import { useNotification } from "../context/NotificationContext.js";
import Spinner from './Spinner.js';
import ConfirmModal from "./ConfirmModal.js";

export default function ChangeLogsComponent({}) {
    const [loading, setLoading] = useState(true);
    const [loadingExpanded, setLoadingExpanded] = useState({});
    const [logs, setLogs] = useState([]);
    const [logToDelete,  setLogToDelete ] = useState(null);
    const [expandedLogs, setExpandedLogs] = useState({});
    const { onError } = useNotification();

    const handleSetExpanded = async(log) => {
        let updatedExpandedList = { ...(expandedLogs || {}) };
        const compressed = utils.isEmpty(updatedExpandedList[log.id]);
        if(compressed) {
            //setLoadingExpanded((prev) => ({...prev, [expense.id]: true}));
            //await get the changed document... todo
            //setLoadingExpanded((prev) => ({...prev, [expense.id]: false}));
            updatedExpandedList[log.id] = log;
        } else {
            updatedExpandedList[log.id] = null;
        }

        setExpandedLogs(updatedExpandedList);
    }

    const handleDeleteLog = async() => {
        if(!logToDelete || utils.isEmpty(logToDelete.id)) {
            return;
        }
        const result = await logsService.remove(logToDelete.id, onError);
        if(result) {
            setLogToDelete(null);
        }
    }
    
    useEffect(() => {
        const getLogs = async() => {
            const filter = {after : utils.now(-5)};
            const userLogs = await logsService.get(filter, onError);
            setLogs(userLogs);
            setLoading(false);
        }

        getLogs();
    });

    if(loading) {
        return (
            <p>Loading...</p>
        );
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Change Logs</h2>
                </div>
            </div>
            <div className="card-content">
                {logs.map((log) => {
                    return (
                        <React.Fragment key={log.id}>
                            <div className="log-box" onClick={()=> handleSetExpanded(log)}>
                                <div className="log-header">
                                    <div className="log-header-left">
                                        <div className="log-title">
                                            {`${utils.capitalizeWords(log.action)}`}
                                        </div>
                                    </div>
                                    <div className="log-header-right">
                                        <div>
                                            {"Placeholder 1"}
                                        </div>
                                        <div className="expand-icon">
                                            {expandedLogs[log.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.to_ddMMYY(log.createdAt, "/")}
                                </div>

                                {loadingExpanded?.[log.id] === true ? (
                                    <Spinner />
                                ) : expandedLogs?.[log.id] ? (
                                    <div className="expense-body">
                                        <div>
                                            Purchased By: {utils.capitalizeWords(expense.purchasedBy)}
                                        </div>
                                        <div className="log-body-footer">   
                                            <div className="log-body-footer-icon">
                                                <Trash2  
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpenseToDelete(expense);
                                                    }}
                                                />
                                                <p>Delete</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (<></>)}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {logToDelete && (
                <ConfirmModal 
                    onCancel={() => setLogToDelete(null)}
                    onConfirm={handleDeleteLog}
                />
            )}
        </div>
    );
}
