import React, { useState, useEffect } from 'react';
import * as utils from "../utils.js";
import { groupByCourse } from '../services/mealService.js';
import * as invoiceService from "../services/invoiceService.js";
import * as menuService from "../services/menuService.js";
import "./DishesSummaryComponent.css";
import { Image as ImageIcon} from 'lucide-react';
import Spinner from './Spinner.js';

import { getPhotoUrl } from '../daos/storageDao.js';

export default function DishesSummaryComponent({dishes}) {

    const [loadingImages, setLoadingImages] = useState({});
    const [photoUrls, setPhotoUrls] = useState({});
    const [displayImageForDish, setDisplayImageForDish] = useState(null);

    const getUrl = async(dish) => {
        const dishesData = await menuService.get({"name": dish.name});
        const dishData = dishesData.length > 0 ? dishesData[0] : null;
        const photoUrl = dishData && dishData.photoUrl ? await getPhotoUrl(dishData.photoUrl) : "";
        return photoUrl;
    }

    useEffect(() => {
        const getPhotoUrls = async() => {
            const dishPhotoUrls = {};
            for(const dish of dishes) {
                const photoUrl = await getUrl(dish);
                if(!utils.isEmpty(photoUrl)) dishPhotoUrls[dish.name] = photoUrl;
            }
            setPhotoUrls(dishPhotoUrls);
        }

        getPhotoUrls();
    }, []);

    const handleDishImageLoadStatusChange = function(dish, status) {
        const newLoadingImages = {...(loadingImages || {})};
        newLoadingImages[dish.name] = status;
        setLoadingImages(newLoadingImages);
    }

    const handleDishImageClick = async(dish) => {
        handleDishImageLoadStatusChange(dish, true);
        setDisplayImageForDish(dish);
    }

    if(utils.isEmpty(dishes)) {
       return (
            <p>No dishes ordered yet</p> 
       );
    }
    
    // Group by e.g. mains, starters, drinks, etc...
    const groupedByCourse = groupByCourse(dishes);

    // Sort appearance of meals by meal categories, i.e. first starters, then mains, lastly coffee, etc..
    const groupedByCourseSorted = Object.keys(groupedByCourse).sort((a, b) => a.localeCompare(b));

    return (
        <div className="dishes-summary">
            <p><b>Dishes</b></p>
            <div className="courses-summary">
                {groupedByCourseSorted.map((priorityAndCourse) => {
                    const dishes = groupedByCourse[priorityAndCourse];
                    const [priority, course] = priorityAndCourse.split(",");
                    return(
                        <div>
                            <p className="course-summary-header">
                                <b>{utils.capitalizeWords(course)}</b>
                            </p>
                            {dishes.filter((dish) => dish.quantity > 0).map((dish) => (
                                <React.Fragment key={`summary-${dish.id}`}>
                                    <div className="dish-line">
                                        {!utils.isEmpty(photoUrls[dish.name]) ? (
                                            <ImageIcon 
                                                size={20} 
                                                color="black" 
                                                onClick={() => handleDishImageClick(dish) }
                                            />
                                        ) : (
                                            <div style={{ width: 20, height: 20 }} />
                                        )}
                                        <p className="dish-text">{invoiceService.dishReceiptLine(dish)}</p>
                                        {loadingImages[dish.name] === true && (<Spinner size={10}/>)}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    )
                })}
            </div>
            {displayImageForDish !== null && (    
                <img
                    src={photoUrls[displayImageForDish.name]}
                    className="dish-image"
                    onClick={() => setDisplayImageForDish(null)}
                    onLoad={() => handleDishImageLoadStatusChange(displayImageForDish, false)}
                />
            )}
        </div>
    );
}
