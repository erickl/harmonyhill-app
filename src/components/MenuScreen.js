import React, { useEffect, useState } from 'react';
import * as menuService from "../services/menuService.js";
import { useConfirmationModal } from '../context/ConfirmationContext.js'; 
import { useNotification } from '../context/NotificationContext.js';
import MealComponent from './MealComponent.js';
import { useSuccessNotification } from '../context/SuccessContext.js';

export default function MenuScreen({context}) {
    const [items, setItems] = useState([]);

    const { onConfirm } = useConfirmationModal();
    const { onSuccess } = useSuccessNotification();
    const { onError } = useNotification();

    useEffect(() => {
        const loadMenu = async () => {
            const items = await menuService.get();
            setItems(items);
        };

        loadMenu();
    }, []);

    const handleDeleteItem = async (item) => {
        onConfirm(`Are you sure you want to delete ${item.name}?`, async () => {
            const deleteResult = await menuService.remove(item, onError);

            if (deleteResult !== false) {
                const newItems = items.filter((item2) => item2.id !== item.id);
                setItems(newItems);
                onSuccess();
            }
        });
    }

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Menu</h2>
                </div>
            </div>
            <div className="card-content">
                {items.map((item) => {
                    return (
                        <MealComponent
                            context={context}
                            item={item}
                            handleDelete={handleDeleteItem}
                        />
                    );
                })}
            </div>
        </div>
    );
}
