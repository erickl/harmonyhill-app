import { Flag } from 'lucide-react';
import {useInput} from '../context/InputContext.js';
import "./IssueFlagButton.css";

export default function IssueFlagButton({record, onFlagIssue}) {
    const flagStyle = {color: record.issue === "attention" ? "red" : "black"};
    const flagText = record.issue === "attention" ? "Resolve" : "Issue";

    const {onInput} = useInput();

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
                        onInput(onSubmitInput);
                    }}
                />
                <p>{flagText}</p>
            </div>
        </div>
    )
}