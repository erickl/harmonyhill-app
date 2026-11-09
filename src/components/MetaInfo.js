import "./MetaInfo.css";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { useGenericModal } from '../context/GenericContext.js';
import {buildLogsDom} from "../services/logsService.js";

export default function MetaInfo({document}) {

    const { onError } = useNotification();
    const {onDisplayPopup} = useGenericModal();

    const handleMetaInfoClick = () => {
        const builtLogs = buildLogsDom(document, onError);
        const header = `Change Logs`;
        onDisplayPopup(header, builtLogs);
    }

    let metaInfo = "";

    if(document) {
        const createdAt = utils.to_ddMMM_HHmm(document.createdAt);
        const updatedAt = utils.exists(document, "updatedAt") ? utils.to_ddMMM_HHmm(document.updatedAt) : "";
        const createdMetaInfo = `Created by ${document.createdBy}, ${createdAt}`;
        const updatedMetaInfo = document.updatedBy ? ` | Updated by ${document.updatedBy}, ${updatedAt}` : "";
        metaInfo = `${createdMetaInfo}${updatedMetaInfo}`; 
    }

    return (
        <div>
            <span className="meta-text" onClick={(e) => {
                e.stopPropagation();
                handleMetaInfoClick();
            }}>
                {metaInfo}
            </span>
        </div>
    );
}
