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
import AddTodoStepModal from './AddTodoStepModal.js';
import TodoStepComponent from './TodoStepComponent.js';
import "./TodoComponent.css";

export default function TodoComponent({ todo, handleDelete, onNavigate, onClose }) {
    const [expanded,         setExpanded        ] = useState(false);
    const [loading,          setLoading         ] = useState(false);
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin,          setIsAdmin         ] = useState(false);
    const [steps,            setSteps           ] = useState([]);
    const [addStepToTodo,    setAddStepToTodo   ] = useState(null);

    const { onOpenCamera } = useCameraModal();
    const { onError    } = useNotification();
    const { onConfirm  } = useConfirmationModal();
    const { onSuccess  } = useSuccessNotification();

     useEffect(() => {
        const load = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);

            setLoading(false);
        }

        load();
    }, []);

    const onTodoStepCreated = async(newTodoStep) => {
        const newSteps = [...(steps || [])];
        newSteps.push(newTodoStep);
        setSteps(newSteps);
    }

    const handleSetExpanded = async() => {
        setLoading((prev) => !prev);
        
        // todo: fetch todo steps and other info
        const steps_ = await todoService.getTodoSteps(todo.id, {}, onError);
        setSteps(steps_);

        setExpanded((prev) => !prev)

        setLoading((prev) => !prev);
    }

    return (
        <div className="todo-box" onClick={() => handleSetExpanded()}>
            <div className="todo-header">
                <div className="todo-header-left">
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
                                    <TodoStepComponent todoStep={step} />
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div className="todo-body-footer">
                        <div className="todo-body-footer-icon">
                            <Plus   
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAddStepToTodo(todo);
                                }}
                            />
                            <p>Add step</p>
                        </div>
                        <div className="todo-body-footer-icon">
                            <Pencil   
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate("add-todo", {todoToEdit:todo})
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
                    <MetaInfo document={todo}/>
                </div>
            ) : (<></>)}

            {addStepToTodo && (
                <AddTodoStepModal
                    todo={addStepToTodo}
                    onNavigate={onNavigate}
                    onCreated={(newTodoStep) => onTodoStepCreated(newTodoStep)}
                    onClose={() => setAddStepToTodo(null)}
                />
            )}
        </div>
    );
}