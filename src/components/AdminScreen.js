import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import * as ledgerService from "../services/ledgerService.js";
import { useNotification } from "../context/NotificationContext.js";

export default function AdminScreen({}) {
     const { onError } = useNotification();

    return (
        <div>
            <button onClick={() => ledgerService.closeMonth(onError)}>
                Close month
            </button>
        </div>
    );
}
