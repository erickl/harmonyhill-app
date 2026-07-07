// in progress: this file is meant as a common code base for meals, activities and todos (tasks)

export async function makeChangeLog(existing, updateData) {
    // If user already accepted the task, create change description
    if(updateData.assigneeAccept) {
        const thisUser = await userService.getCurrentUserName();
        
        // If the assignee herself is changing the data, no need to accept the task change again
        if(thisUser !== updateData.assignedTo) {
            updateData.changeDescription = activityService.getChangeDescription(existing, updateData);
        }
    }
    updateData.assigneeAccept = updateData.assigneeAccept && utils.isEmpty(updateData.changeDescription);
}

function makeChangeLogData() {
    let changeDescription = [];
    
    if(!utils.dateIsSame(oldData.startingAt, newData.startingAt)) {
        changeDescription.push(`New start date: from ${utils.to_yyMMddHHmm(oldData.startingAt, "/")} to ${utils.to_yyMMddHHmm(newData.startingAt, "/")}`);
    }

    if(oldData.provider !== newData.provider) {
        changeDescription.push(`New provider: from ${oldData.provider} to ${newData.provider}`);
    }

    if(oldData.comments !== newData.comments) {
        changeDescription.push(`Comments update: from ${oldData.comments} to ${newData.comments}`);
    }

    if(!utils.isEmpty(newData?.dishes)) {
        if(utils.isEmpty(oldData.dishes)) {
            changeDescription.push(`Dishes added to the meal`);
        }

        const oldDishes = await getMealDishes(oldData.bookingId, oldData.id);

        for(const newDish of newData.dishes) {         
            const oldDish = oldDishes.find((dish) => dish.name === newDish.name);
            if(!oldDish) {
                changeDescription.push(`New dish added: ${newDish.quantity}x ${newDish.name}`);
            }
            else if(oldDish.quantity !== newDish.quantity) {
                changeDescription.push(`Dish amount for "${newDish.name}" changed, from ${oldDish.quantity}x to ${newDish.quantity}x`);
            }
        }
    }
    return changeDescription;
}