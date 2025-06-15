import React from "react";

const DishesPopup = ({ options, selectedDishes, onAddDish, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Select an Option</h3>
        <div className="options">
          {options.map((newDish) => (
            <button 
                key={`${newDish.id}-select-wrapper`} 
                onClick={() => onAddDish(selectedDishes, newDish)}>
              {newDish.name}
            </button>
          ))}
        </div>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default DishesPopup;