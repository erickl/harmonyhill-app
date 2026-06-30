import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Camera } from 'lucide-react';
import MetaInfo from './MetaInfo.js';
import { useCameraModal } from "../context/CameraContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useNotification } from "../context/NotificationContext.js";
import { useUserPermissions } from "../context/UserPermissionsContext.js";
import StatusCircle from "./StatusCircle.js";
import AlertCircle from "./AlertCircle.js";
import PhotoUploadButton from "./PhotoUploadButton.js";
import TaskAcceptButton from "./TaskAcceptButton.js";
import TaskAssigneeComponent from './TaskAssigneeComponent.js';
import * as todoService from "../services/todoService.js";
import * as utils from "../utils.js";
import { Alert } from "../models/Alert.js";
import * as ActivityStatus from "../models/ActivityStatus.js";
import Spinner from "./Spinner.js";
import "./TodoComponent.css";
import { motion } from "framer-motion";

export default function TodoComponent({ todo, handleDelete, onCompleteFromParent, onNavigate, onClose }) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [steps, setSteps] = useState([]);
    const [assigneeStyleIndex, setAssigneeStyleIndex] = useState(0);
    const [status, setStatus] = useState(todo.status);
    const [alert, setAlert] = useState(null);
    const [requiredPhotosUploaded, setRequiredPhotosUploaded] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [assigneeAccept, setAssigneeAccept] = useState(todo.assigneeAccept);

    const { onOpenCamera } = useCameraModal();
    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { permissions } = useUserPermissions();

    const canStart = () => {
        const isGoodToGo = ActivityStatus.GoodToGo.equals(status);
        if (!isGoodToGo) {
            return false;
        }
        return true;
    }

    const canAddPhotos = () => {
        const isCompleted = ActivityStatus.Completed.equals(status);
        if (isCompleted) return false;

        const isStarted = ActivityStatus.Started.equals(status);
        if (isStarted) return true;

        const isGoodToGo = ActivityStatus.GoodToGo.equals(status);
        if (!isGoodToGo) return false;

        return isGoodToGo;
    }

    const canComplete = () => {
        const isGoodToGo = ActivityStatus.GoodToGo.equals(status);
        const isStarted = ActivityStatus.Started.equals(status);
        const canStillStart = canStart();

        const now = utils.now();
        const minutesLeft = todo.deadlineAt.diff(now, 'minutes').minutes;

        // If photos are required, see that they've been uploaded
        if (isStarted && requiredPhotosUploaded) {
            return true;
        } else if (!isStarted && canStillStart) {
            return false;
        } else if (isGoodToGo && requiredPhotosUploaded) {
            return true;
        }

        return false;
    }

    const calculateTodoStatus = async (newStatus = null) => {
        if (!todo) return;

        if (!newStatus) {
            newStatus = await todoService.getStatus(todo, onError);
        }
        setStatus(newStatus);

        const currentAlert = await todoService.getAlert(todo, newStatus, onError);
        setAlert(currentAlert);

        return { status: newStatus, alert: currentAlert };
    }

    const handleAssigneeStatusChange = async (isAccepted) => {
        const result = await todoService.assigneeAccept(todo, isAccepted, onError);
        if (result !== false) {
            setAssigneeAccept(isAccepted);
        }
    }

    const onUploadPhoto = async (fileData) => {
        const photoRecord = await todoService.uploadPhoto(todo, fileData, onError);
        if (photoRecord !== false) {
            setRequiredPhotosUploaded(true);
        }
        return photoRecord
    }

    const onTodoStepCreated = async (newTodoStep) => {
        const newSteps = [...(steps || [])];
        newSteps.push(newTodoStep);
        setSteps(newSteps);
    }

    const onTodoStepRemoved = async (todoToDelete) => {
        onConfirm(`Are you sure you want to delete todo ${todoToDelete.id}?`, async () => {
            const result = await todoService.remove(todoToDelete, onError);
            if (result !== false) {
                let newSteps = [...(steps || [])];
                newSteps = newSteps.filter((step) => step.id !== todoToDelete.id);
                setSteps(newSteps);
                onSuccess();
            }
        });
    }

    const onToggleChild = () => {
        // todo
    }

    const handleSetExpanded = async () => {
        setLoading((prev) => !prev);

        const steps_ = await todoService.get(todo, {}, onError);
        setSteps(steps_);

        const photos_ = await todoService.getPhotos(todo, onError);
        setPhotos(photos_);

        setExpanded((prev) => !prev)
        setLoading((prev) => !prev);
    }

    const handleSetStatusManually = async (newStatus) => {
        if (newStatus == null) return;

        let confirmationText = `Set todo status to ${newStatus.name}?`;
        //const minutesLeft = todo.startingAt.diff(utils.now(), 'minutes').minutes;

        onConfirm(confirmationText, async () => {
            const result = await todoService.setStatus(todo, newStatus.name, onError);
            if (result !== false) {
                setStatus(newStatus);
                if (ActivityStatus.Completed.equals(newStatus)) {
                    onCompleteFromParent(todo, true);
                } else {
                    onCompleteFromParent(todo, false);
                }
                onSuccess();
            }
        });
    }

    useEffect(() => {
        calculateTodoStatus();
    }, []);

    const deadlineDate = utils.isDate(todo.deadlineAt) ? utils.to_ddMMYY(todo.deadlineAt, "/") : "";
    const deadlineTime = utils.isDate(todo.deadlineTime) ? utils.to_HHmm(todo.deadlineTime) : "";
    const deadlineDateTime = `${deadlineDate} ${deadlineTime}`.trim();

    const deadlineTime_HHmm = utils.to_HHmm(todo.deadlineTime);

    //const todoHasChanged = !utils.isEmpty(todo.changeDescription) // todo

    return (
        <div className="todo-box">
            <div className="activity-header" onClick={(e) => {
                e.stopPropagation();
                handleSetExpanded();
            }}>
                <div className="activity-header-left">
                    <div className="todo-header-top-left">
                        {"TODO"}
                    </div>
                    <TaskAssigneeComponent
                        assigneeName={todo.assignedTo}
                        assigneeAccept={assigneeAccept}
                        hasChanged={false}
                    />
                </div>

                <div className="activity-header-time">
                    <span className="preserve-whitespaces">{deadlineTime_HHmm}</span>
                </div>

                <div className="activity-header-right">
                    <div className="activity-header-name">
                        {todo.title}
                    </div>
                    <div className="activity-header-provider">
                        {""}
                    </div>
                    <div className="activity-header-guest">
                        {""}
                    </div>
                </div>

                {/* Display ongoing status of the activity */}
                {status && (
                    <div className="activity-header-status">
                        <StatusCircle
                            status={status.name}
                        />
                    </div>
                )}

                {/* Display alert when something needs to be fixed urgently  */}
                {alert && (<div className="activity-header-status">
                    <AlertCircle
                        status={alert.category}
                    />
                </div>)}

                {/* Grey out the activity header to show it's completed */}
                {todo && ActivityStatus.Completed.equals(todo.status) && utils.isToday(todo.deadlineAt) && (
                    <div className="activity-completed-overlay" />
                )}

                {/* Red out the activity header to show it's OVERDUE to be started/completed */}
                {alert && alert.category === Alert.OVERDUE && (
                    <motion.div
                        className="activity-delayed-overlay"
                        animate={{ scale: [1, 1, 1], opacity: [0.5, 0.1, 0.5] }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                    />
                )}
            </div>


            {loading === true ? (
                <Spinner />
            ) : expanded ? (
                <div className="todo-body">
                    <p><
                        span className="detail-label">Status: </span> {utils.capitalizeWords(status.message)}
                    </p>
                    {alert && !utils.isEmpty(alert.message) && (
                        <p>
                            <span className="detail-label">Alert: </span>
                            <span className="important-badge">{alert.message}</span>
                        </p>
                    )}
                    <div>
                        Description: {todo.description}
                    </div>
                    <div>
                        Duration: {todo.duration} minutes
                    </div>
                    <div>
                        Category: {utils.capitalizeWords(todo.category)}
                    </div>
                    {todo.comments && (<div>
                        Comments: {todo.comments}
                    </div>)}
                    <div>
                        Assigned To: {utils.capitalizeWords(todo.assignedTo)}
                    </div>
                    <div>
                        {steps.map((step) => {
                            return (
                                <React.Fragment key={step.id}>
                                    <TodoComponent
                                        todo={step}
                                        onToggleFromParent={onToggleChild}
                                        handleDelete={onTodoStepRemoved}
                                        onNavigate={onNavigate}
                                        onClose={null}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {!utils.isEmpty(todo.changeDescription) && (
                        <div style={{ color: "red" }}>
                            <p className="preserve-whitespaces">
                                <span className="detail-label">Change:</span>
                                {todo.changeDescription.map((change) => {
                                    return (<p>• {change}</p>)
                                })}
                            </p>
                        </div>
                    )}

                    <div className="todo-body-footer">
                        <div className="todo-body-footer-icon">
                            <Plus
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate("add-todo", {
                                        parent: todo,
                                        onCreated: onTodoStepCreated
                                    })
                                }}
                            />
                            <p>Add step</p>
                        </div>
                        <div className="todo-body-footer-icon">
                            <Pencil
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate("add-todo", { todoToEdit: todo })
                                }}
                            />
                            <p>Edit</p>
                        </div>

                        {permissions.isManagerOrAdmin && (
                            <div className="todo-body-footer-icon">
                                <Trash2
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(todo);
                                    }}
                                />
                                <p>Delete</p>
                            </div>
                        )}

                        <TaskAcceptButton
                            taskDate={todo.deadlineAt}
                            status={todo.status}
                            assignedTo={todo.assignedTo}
                            isAccepted={todo.assigneeAccept}
                            handleClick={handleAssigneeStatusChange}
                        />

                        {/* Mark activity started */}
                        {canStart() && (
                            <div className="todo-body-footer-icon">
                                <StatusCircle
                                    status={ActivityStatus.Started.name}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetStatusManually(ActivityStatus.Started);
                                    }}
                                />
                                <p>Start it</p>
                            </div>
                        )}

                        {/* Todo (dev-100): for this, we have to fetch the dishes, which we normally don't do until the activity details component is expanded */}
                        {/* Mark activity started */}
                        {canComplete() && (
                            <div className="todo-body-footer-icon">
                                <StatusCircle
                                    status={ActivityStatus.Completed.name}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetStatusManually(ActivityStatus.Completed);
                                    }}
                                />
                                <p>Complete it</p>
                            </div>
                        )}

                        {canAddPhotos() && (
                            <PhotoUploadButton
                                instructions={todo.photoInstructions}
                                photos={photos}
                                onUpload={onUploadPhoto}
                                path={todoService.getTodoPhotoFilePath(todo)}
                                isRequired={true}
                            />
                        )}

                    </div>
                    <MetaInfo document={todo} />
                </div>
            ) : (<></>)}
        </div>
    );
}