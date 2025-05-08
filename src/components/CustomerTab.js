import React, { useState } from 'react';

function CustomerTab({ customer, onPurchaseAdded }) {
    const [newItem, setNewItem] = useState('');
    const [newPrice, setNewPrice] = useState('');

    const handleAddPurchase = (event) => {
        event.preventDefault();

        if (customer && newItem && newPrice) { // Now checking if customer exists before proceeding
            const newPurchase = {
                id: Date.now().toString(),
                item: newItem,
                price: parseFloat(newPrice),
                timestamp: new Date().toISOString(),
            };

            onPurchaseAdded(customer.id, newPurchase);
            setNewItem('');
            setNewPrice('');
        } else if (!customer) {
            alert('No customer selected to add a purchase to.');
        } else {
            alert('Please enter both item and price.');
        }
    };

    if (!customer) {
        return <p>No customer selected.</p>;
    }

    return (
        <div>
            <h2>Customer Tab</h2>
            <h3>{customer.name}</h3>
            <p>Villa: {customer.villa}</p>
            <p>Stay Dates: {customer.stayDates.start} - {customer.stayDates.end}</p>
            <p>Promotions: {customer.promotions || 'None'}</p>
            <p>Source: {customer.source}</p>
            <p>Allergies: {customer.allergies || 'None'}</p>
            <p>Country: {customer.country || 'N/A'}</p>
            <p>Other Details: {customer.otherDetails || 'N/A'}</p>

            <h3>Purchases</h3>
            {customer.purchases.length === 0 ? (
                <p>No purchases logged yet.</p>
            ) : (
                <ul>
                    {customer.purchases.map(purchase => (
                        <li key={purchase.id}>
                            {purchase.item} - {purchase.price} IDR ({purchase.timestamp})
                        </li>
                    ))}
                </ul>
            )}

            <h3>Add New Purchase</h3>
            <form onSubmit={handleAddPurchase}>
                <div>
                    <label htmlFor="item">Item:</label>
                    <input
                        type="text"
                        id="item"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="price">Price (IDR):</label>
                    <input
                        type="number"
                        id="price"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Add Purchase</button>
            </form>
        </div>
    );
}

export default CustomerTab;