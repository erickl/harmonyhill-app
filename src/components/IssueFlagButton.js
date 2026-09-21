import { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';
import {useIssues} from '../context/IssueContext.js';
import * as utils from "../utils.js";
import "./IssueFlagButton.css";
import * as issueService from "../services/issueService.js";

export default function IssueFlagButton({record, onSubmitInput}) {
    const [isResolved, setIsResolved] = useState(true);
    
    const {onInput} = useIssues();

    const setResolvedStatus = (status) => {
        const isResolved_ = utils.isEmpty(record.issue) || record.issue === "resolved";
        setIsResolved(isResolved_);
    }

    useEffect(() => {
        setResolvedStatus(record.issue);
    }, [record]);

    const handleClick = async() => {
        onInput(record, async(data) => {
            const result = await onSubmitInput(record, data);
            if(result !== false) {
                setResolvedStatus(result.status);
            }
            return result;
        });
    }

    const flagStyle = {color: isResolved ? "black" : "red"};
    const flagText = isResolved ? "Report" : "Resolve";

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