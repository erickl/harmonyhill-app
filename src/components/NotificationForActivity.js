import { useEffect, useState } from "react";
import * as activityService from "../services/activityService.js";
import {useToast} from "../context/ToastContext.js";

export default function NotificationForActivity({id}) {
    const [activity, setActivity] = useState(null);

    const {onError} = useToast();

    useEffect(() => {
        (async() => {
            // Todo: Right now, there's insufficient data inside the notification to get the activity data  
            //const activity_ = await activityService.getOneActivity(id, onError);
            //setActivity(activity_);
        })();
    }, []);

    return (
        <div>
            {activity && (activity.displayName)}
        </div>
    );
}