import React, {useState, useEffect} from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useUserPermissions} from "../context/UserPermissionsContext.js";
import { useNotification } from "../context/NotificationContext.js";
import * as utils from "../utils.js";
import { motion } from "framer-motion";
import * as ActivityStatus from "../models/ActivityStatus.js";
import "./TaskAcceptButton.css";

export default function TaskAcceptButton({taskDate, status, assignedTo, isAccepted, handleClick}) {
    const { user } = useUserPermissions();
    const { onError } = useNotification();

    const thisUserIsAssigned = user && (user.shortName === assignedTo || user.name === assignedTo);

    const handleClick_ = async(newIsAccepted) => {
        const result = await handleClick(newIsAccepted);
        if(result === false) return false;
        return true;
    }

    return (
        <div>
            {thisUserIsAssigned && !isAccepted && (<>
                {(utils.isTomorrow(taskDate) || utils.isToday(taskDate)) ? (

                    <div className="footer-icon">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                        >
                            <ThumbsUp
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick_(true);
                                }}
                            />
                        </motion.div>
                        <p>Accept task?</p>
                    </div>
                ) : (
                    <div className="footer-icon">
                        <ThumbsUp
                            onClick={(e) => {
                                e.stopPropagation();
                                onError("Only available from 1 day before, and if all activity info is provided");
                            }}
                        />
                        <p>Unavailable</p>
                    </div>
                )}
            </>)}

            {thisUserIsAssigned && isAccepted &&
                ActivityStatus.Started.equals(status) === false &&
                !utils.isPast(taskDate) && (

                    <div className="footer-icon">
                        <ThumbsDown
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick_(false);
                            }}
                        />
                        <p>Decline task?</p>
                    </div>
                )
            }
        </div>
    )
}