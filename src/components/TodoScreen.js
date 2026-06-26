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
    const [todos,            setTodos           ] = useState([]   );
    const [loading,          setLoading         ] = useState(true );
    const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
    const [isAdmin,          setIsAdmin         ] = useState(false);

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

    useEffect(() => {
        const fetchTodos = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);

            const userIsAdminOrManager = await userService.isManagerOrAdmin();
            setIsManagerOrAdmin(userIsAdminOrManager);

            const filter = {};
            const todos_ = await todoService.get(null, filter, onError);
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
                            <TodoComponent 
                                todo={todo}
                                handleDelete={handleDelete}
                                onNavigate={onNavigate} 
                                onClose={onClose}
                            />
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
