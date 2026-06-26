import React, { useState, useEffect } from 'react';
import * as todoService from "../services/todoService.js";
import { useNotification } from "../context/NotificationContext.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import "./TodoScreen.css";
import VeganHamburgerButton from './VeganHamburgerButton.js';
import { useConfirmationModal } from "../context/ConfirmationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";

import { useFilters } from "../context/FilterContext.js";

import TodoComponent from './TodoComponent.js';

export default function TodoScreen({ onNavigate, onClose }) {
    const [todos,              setTodos              ] = useState([]   );
    const [completedTodos,     setCompletedTodos     ] = useState([]   );
    const [loading,            setLoading            ] = useState(true );
    const [showCompletedTodos, setShowCompletedTodos ] = useState(false );
    const [isManagerOrAdmin,   setIsManagerOrAdmin   ] = useState(false);
    const [isAdmin,            setIsAdmin            ] = useState(false);

    const { onFilter   } = useFilters();
    const { onError    } = useNotification();
    const { onConfirm  } = useConfirmationModal();
    const { onSuccess  } = useSuccessNotification();

    const handleDelete = async(todoToDelete) => {
        if(!todoToDelete || utils.isEmpty(todoToDelete.id)) return;
        
        onConfirm(`Are you sure you want to delete todo ${todoToDelete.id}?`, async () => {
            const result = await todoService.remove(todoToDelete, onError);
            if(result !== false) {
                let newTodos = utils.deepCopy(todos);
                newTodos = newTodos.filter((todo) => todo.id !== todoToDelete.id);
                setTodos(newTodos);
                onSuccess();
            }
        });
    };

    const toggleTodo = async(todo, isCompleted) => {
        const newTodo = { ...todo, isCompleted: isCompleted }

        const todoSort = (t1, t2) => {
            if(utils.isDate(t1.deadlineAt) && utils.isDate(t2.deadlineAt)) {
                return t1.deadlineAt.toMillis > t2.deadlineAt.toMillis;
            }
            else return false;
        };

        if(isCompleted) {
            setTodos(prev => prev.filter(t => t.id !== newTodo.id));
            setCompletedTodos(prev => [...prev, newTodo].sort(todoSort));
        } else {
            setCompletedTodos(prev => prev.filter(t => t.id !== newTodo.id));
            setTodos(prev => [...prev, newTodo].sort(todoSort));
        }
    }

    const handleExpandCompletedTodos = async() => {
        if(!showCompletedTodos) {
            const completedTodos_ = await todoService.get(null, {isCompleted : true}, onError);
            setCompletedTodos(completedTodos_);
        }
        setShowCompletedTodos(!showCompletedTodos);
    }

    useEffect(() => {
        const fetchPermissions = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);
        };

        const fetchTodos = async(isCompleted) => {
            const todos_ = await todoService.get(null, {isCompleted : isCompleted}, onError);
            setTodos(todos_);
            setLoading(false);
        };

        fetchPermissions();

        fetchTodos(false);
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
                            <TodoComponent 
                                todo={todo}
                                handleDelete={handleDelete}
                                onToggleFromParent={toggleTodo}
                                onNavigate={onNavigate} 
                                onClose={onClose}
                            />
                        </React.Fragment>
                    )
                })}
            </div>

            {/* Hidden completed todos */}
            <div key="completed-todos">
                <div className="course-header" onClick={() => handleExpandCompletedTodos()}>
                    <h3>{showCompletedTodos ? ' ▼' : ' ▶'}</h3>
                    <h2>Completed</h2>
                </div>
                {showCompletedTodos && (<>
                    {completedTodos.map((todo) => {
                        return (
                            <React.Fragment key={todo.id}>
                                <TodoComponent 
                                    todo={todo}
                                    onToggleFromParent={toggleTodo}
                                    handleDelete={handleDelete}
                                    onNavigate={onNavigate} 
                                    onClose={onClose}
                                />
                            </React.Fragment>
                        )
                    })}
                </>)}
            </div>
        </div>
    )
}
