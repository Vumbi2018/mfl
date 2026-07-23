import React from 'react';

export const Switch = ({ checked, onChange, disabled, className = '' }) => {
    return (
        <div className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in ${className}`}>
            <input
                type="checkbox"
                name="toggle"
                id="toggle"
                className={`toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer duration-200 ease-in ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'right-0 border-primary' : 'left-0 border-gray-300'}`}
                checked={checked}
                onChange={(e) => !disabled && onChange(e)}
                disabled={disabled}
            />
            <label
                htmlFor="toggle"
                className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer duration-200 ease-in ${checked ? 'bg-primary' : 'bg-gray-300'}`}
            ></label>
        </div>
    );
};
