import { createContext, useContext, useState, useCallback } from 'react';

const MenuContext = createContext();

export function MenuProvider({ children }) {
    const [open, setOpen] = useState({});
    
    const toggle = useCallback((id) => {
        setOpen(prev => ({...prev, [id]: !prev[id] }));
    }, []);
    
    const close = useCallback((id) => {
        setOpen(prev => ({...prev, [id] : false}));
    }, []);

    return (
        <MenuContext.Provider value={{ open, toggle, close }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu(id = "default") {
    const context = useContext(MenuContext);
    
    return {
        toggle : () => context.toggle(id),
        close : () => context.close(id),
        open : context.open[id] === true,
    };
}