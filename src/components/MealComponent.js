import React, { useState, useEffect } from 'react';
import * as mealService from "../services/mealService.js";
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { useNotification } from "../context/NotificationContext.js";
import { Pencil, Trash2, Candy } from 'lucide-react';
import MetaInfo from "./MetaInfo.js";
import Spinner from './Spinner.js';
import * as utils from "../utils.js";
import "./MealComponent.css";

export default function MealComponent({context, item, handleDelete}) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const { permissions } = useUserPermissions();
    const { onError } = useNotification();

    const fetchItemInfo = async (item) => { 

    };

    const handleSetExpanded = async(item) => {
        if(!expanded) {
            setLoading(prev => !prev);
            await fetchItemInfo(item); 
            setLoading(prev => !prev);
        } 
        setExpanded(prev => !prev);
    }

    return (
        <div className="meal-item-box" onClick={()=> handleSetExpanded(item)}>
            <div className="meal-item-header">
                <div className="meal-item-header-left">
                    <div className="meal-item-title">
                        {`${utils.capitalizeWords(item.name)}`}
                    </div>
                </div>
                <div className="meal-item-header-right">
                    <div>
                        {utils.formatDisplayPrice(item.customerPrice)}
                    </div>
                    <div className="expand-icon">
                        {expanded ? '▼' : '▶'}
                    </div>
                </div>
            </div>  
            
            <div>
                {utils.capitalizeWords(item.course)} 
            </div>

            {loading ? (
                <Spinner />
            ) : expanded ? (
                <div className="meal-item-body">
                    {item.description && (
                        <div>
                            Description: {item.description}
                        </div>
                    )}
                
                    <div className="meal-item-body-footer">
                        {permissions.isAdmin && (
                            <div className="meal-component-footer-icon">
                                <Pencil
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        context.onNavigate("add-menu-item", {
                                            item: item,
                                        });
                                    }}
                                />
                                <p>Edit</p>
                            </div>
                        )}

                        {permissions.isAdmin && (
                            <div className="meal-component-footer-icon">
                                <Trash2
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                />
                                <p>Delete</p>
                            </div>
                        )}
                    </div>
                    
                    <MetaInfo document={item}/>
                </div>
            ) : (<></>)}
        </div>
    );
}
