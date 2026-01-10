import React, { useState, useEffect } from 'react';
import * as todoService from "../services/todoService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import "./TodoScreen.css";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import Spinner from "./Spinner.js";
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import { Pencil, Trash2 } from 'lucide-react';
import MetaInfo from './MetaInfo.js';
import { useFilters } from "../context/FilterContext.js";
import { useProgressCounter } from "../context/ProgressContext.js";
import { useCameraModal } from "../context/CameraContext.js";

export default function TodoScreen({ onNavigate, onClose }) {

    const [expandedTodos,    setExpandedTodos   ] = useState({}   );
    const [loadingExpanded,  setLoadingExpanded ] = useState({}   );
    const [todos,            setTodos           ] = useState([]   );
    const [loading,          setLoading         ] = useState(true );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin,          setIsAdmin         ] = useState(false);

    const { onFilter   } = useFilters();
    const { onError    } = useNotification();
    const { onProgress } = useProgressCounter();
    const { onConfirm  } = useConfirmationModal();
    const { onSuccess  } = useSuccessNotification();
    const { onOpenCamera } = useCameraModal();

    const handleSetExpanded = async(todo) => {
        setLoadingExpanded((prev) => ({...prev, [todo.id]: true}));
        await fetchInfo(todo);
        setLoadingExpanded((prev) => ({...prev, [todo.id]: false}));
    }

    const fetchInfo = async (todo) => {
        let updatedExpandedList = { ...(expandedTodos || {}) };
        
        const expand = utils.isEmpty(updatedExpandedList[todo.id]);
        if(expand) {
            // maybe fetch sub todos here
            updatedExpandedList[todo.id] = todo;
        } else {
            updatedExpandedList[todo.id] = null;
        }

        setExpandedTodos(updatedExpandedList);
    };

    const handleDeleteTodo = async(todoToDelete) => {
        if(!todoToDelete || utils.isEmpty(todoToDelete.id)) return;
        
        onConfirm(`Are you sure you want to delete todo ${todoToDelete.id}?`, async () => {
            const result = await todoService.remove(todoToDelete.id, onError);
            if(result !== false) {
                let newTodos = utils.deepCopy(todos);
                newTodos = newTodos.filter((expense) => expense.id !== todoToDelete.id);
                setTodos(newTodos);
                onSuccess();
            }
        });
    };

    useEffect(() => {
        const fetchTodos = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);

            const filter = {};
            const todos_ = await todoService.get(filter, onError);
            setTodos(todos_);
            
            setLoading(false);
        }

        fetchTodos();
    }, []);

    if(loading) {
        return (
            <p>Loading...</p>
        )
    }
     
    return (
        <div className="fullscreen">
            <div className="card-header">
                <div className='card-header-left'>
                    <VeganHamburgerButton />
                    <h2 className="card-title">Todo List</h2>
                </div>
            
                <div className="card-header-right">
                    <div>
                        <div className="card-header-right-top-row">
                            <button className="add-button" onClick={() => onNavigate("add-todo")}>
                                + 
                            </button>
                        </div>
                    </div>
                </div>  
            </div>
            <div className="card-content">
                {todos.map((todo) => {
                    return (
                        <React.Fragment key={todo.id}>
                            <div className="todo-box" onClick={()=> handleSetExpanded(todo)}>
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
                                            {expandedTodos[todo.id] ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>  
                                
                                <div>
                                    {utils.to_ddMMYY(todo.deadlineAt, "/")}
                                </div>

                                {loadingExpanded?.[todo.id] === true ? (
                                    <Spinner />
                                ) : expandedTodos?.[todo.id] ? (
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
                                        <div className="todo-body-footer">
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
                                                            handleDeleteTodo(todo);
                                                        }}
                                                    />
                                                    <p>Delete</p>
                                                </div>
                                            )}
                                        </div>
                                        <MetaInfo document={todo}/>
                                    </div>
                                ) : (<></>)}
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
