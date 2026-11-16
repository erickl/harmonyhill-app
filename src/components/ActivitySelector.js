import "./ActivitySelector.css";
import { useEffect, useState } from "react";
import { ForkKnife, CarFront, BrushCleaning } from "lucide-react";
import * as activityService from "../services/activityService.js";

export default function ActivitySelector({context}) {
    const iconSize = 60;

    const [category, setCategory] = useState(null);
    const [activityTypes, setActivityTypes] = useState([]);

    useEffect(() => {
        (async () => {
            const activityTypes_ = await activityService.getActivityTypes();
            setActivityTypes(activityTypes_);
        })();
    }, []);

    return (
        <div className="fullscreen">
            <div className="card-header">
                <h2 className="card-title">Category Selection</h2>
            </div>

            {category === null ? (
                <div className="category-grid">
                    <div 
                        className="category-item"
                        onClick={() => setCategory("meal")}
                    >
                        <ForkKnife
                            size={iconSize}
                        />
                        <span>Meals</span>
                    </div>

                    <div 
                        className="category-item"
                        onClick={() => setCategory("transport")}
                    >
                        <CarFront
                            size={iconSize}
                        />
                        <span>Transport</span>
                    </div>

                    <div 
                        className="category-item"
                        onClick={() => setCategory("service")}
                    >
                        <BrushCleaning
                            size={iconSize}
                        />
                        <span>Services</span>
                    </div>
                </div>
            ) : (
                <div className="category-grid">
                    {category}
                </div>
            )}
        </div>
    );
}