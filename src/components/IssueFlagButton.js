import { Flag } from 'lucide-react';
import {useIssues} from '../context/IssueContext.js';
import "./IssueFlagButton.css";
import * as issueService from "../services/issueService.js";

export default function IssueFlagButton({record, onFlagIssue, onResolve}) {
    const flagStyle = {color: record.issue === "attention" ? "red" : "black"};
    const flagText = record.issue === "attention" ? "Resolve" : "Issue";

    const {onInput} = useIssues();

    const handleClick = () => {
        if(flagText === "Issue") {
            onInput(record, onSubmitInput);
        } else if(flagText === "Resolve") {
            onInput(record, onResolveInput);
        }
    }

    const onResolveInput = async(data) => {
        const result = await onResolve(record, data.comment);
        if(result !== false) {
            // todo: maybe change the color of the flag?    
        }
    }

    const onSubmitInput = async (data) => {
        const result = await onFlagIssue(record, data.comment);
        if(result !== false) {
            // todo: maybe change the color of the flag?    
        }
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