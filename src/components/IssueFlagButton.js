import { Flag } from 'lucide-react';
import {useIssues} from '../context/IssueContext.js';
import * as utils from "../utils.js";
import "./IssueFlagButton.css";
import * as issueService from "../services/issueService.js";

export default function IssueFlagButton({record, onSubmitInput}) {
    const isResolved = utils.isEmpty(record.issue) || record.issue === "resolved";
    const flagStyle = {color: isResolved ? "black" : "red"};
    const flagText = isResolved ? "Report" : "Resolve";

    const {onInput} = useIssues();

    const handleClick = async() => {
        onInput(record, async(data) => {
            const result = await onSubmitInput(record, data);
            if(result !== false) {
                // todo: maybe change the color of the flag?    
            }
        });
    }

    return (
        <div className="main-style">
            <div className="footer-icon">
                <Flag 
                    style={flagStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                />
                <p>{flagText}</p>
            </div>
        </div>
    )
}