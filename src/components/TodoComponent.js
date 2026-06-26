import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle, Plus } from 'lucide-react';
import MetaInfo from './MetaInfo.js';
import { useCameraModal } from "../context/CameraContext.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useNotification } from "../context/NotificationContext.js";
import * as todoService from "../services/todoService.js";
import * as userService from "../services/userService.js";
import * as utils from "../utils.js";
import Spinner from "./Spinner.js";
import { Checkbox, FormControlLabel } from '@mui/material';
import AddTodoModal from './AddTodoModal.js';
import AddTodoScreen from './AddTodoScreen.js';
import TodoStepComponent from './TodoStepComponent.js';
import "./TodoComponent.css";

export default function TodoComponent({ todo, handleDelete, onNavigate, onClose }) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [steps, setSteps] = useState([]);
    const [isCompleted, setIsCompleted] = useState(todo.isCompleted);

    const { onOpenCamera } = useCameraModal();
    const { onError } = useNotification();
    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();

    useEffect(() => {
        const load = async () => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);

            setLoading(false);
        }

        load();
    }, []);

    const onTodoStepCreated = async (newTodoStep) => {
        const newSteps = [...(steps || [])];
        newSteps.push(newTodoStep);
        setSteps(newSteps);
    }

    const onTodoStepRemoved = async (todoToDelete) => {
        onConfirm(`Are you sure you want to delete todo ${todoToDelete.id}?`, async () => {
            const result = await todoService.remove(todoToDelete, onError);
            if(result !== false) {
                let newSteps = [...(steps || [])];
                newSteps = newSteps.filter((step) => step.id !== todoToDelete.id);
                setSteps(newSteps);
                onSuccess();
            }
        });
    }

    const onSetStatus = async(isCompleted_) => {
        setIsCompleted(isCompleted_);
        const result = await todoService.setStatus(todo, isCompleted_, onError);
    }

    const handleSetExpanded = async () => {
        setLoading((prev) => !prev);

        // todo: fetch todo steps and other info
        const steps_ = await todoService.get(todo, {}, onError);
        setSteps(steps_);

        setExpanded((prev) => !prev)

        setLoading((prev) => !prev);
    }

    return (
        <div className="todo-box" onClick={(e) => {
            e.stopPropagation(); 
            handleSetExpanded()
        }}>
            <div className="todo-header">
                <div className="todo-header-left">
                    <FormControlLabel
                        onClick={(e) => e.stopPropagation()}
                        control={
                            <Checkbox
                                checked={isCompleted}
                                onChange={(e) => {
                                    onSetStatus(e.target.checked);               
                                }}
                            />
                        }
                        label=""
                    />
                    <div className="todo-title">
                        {`${utils.capitalizeWords(todo.title)}`}
                    </div>
                </div>
                <div className="todo-header-right">
                    <div>
                        {utils.capitalizeWords(todo.assignedTo)}
                    </div>
                    <div className="expand-icon">
                        {expanded ? '▼' : '▶'}
                    </div>
                </div>
            </div>

            <div>
                {utils.to_ddMMYY(todo.deadlineAt, "/")}
            </div>

            {loading === true ? (
                <Spinner />
            ) : expanded ? (
                <div className="todo-body">
                    <div>
                        Description: {todo.description}
                    </div>
                    <div>
                        Duration: {todo.duration} minutes
                    </div>
                    <div>
                        Category: {utils.capitalizeWords(todo.category)}
                    </div>
                    {todo.bookingName && (<div>
                        Booking: {todo.bookingName}
                    </div>)}
                    {todo.activityName && (<div>
                        Activity: {todo.activityName}
                    </div>)}
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
                                        handleDelete={onTodoStepRemoved} 
                                        onNavigate={onNavigate} 
                                        onClose={null}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div className="todo-body-footer">
                        <div className="todo-body-footer-icon">
                            <Plus
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    onNavigate("add-todo", {
                                        parent:todo, 
                                        onCreated:onTodoStepCreated
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
                        {isManagerOrAdmin && (
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
                    </div>
                    <MetaInfo document={todo} />
                </div>
            ) : (<></>)}
        </div>
    );
}