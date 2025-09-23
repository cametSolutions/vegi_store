// Get item from localStorage
export function getLocalStorageItem(key) {
    const data = localStorage.getItem(key);
    if (!data) {
        return null;
    }
    try {
        return JSON.parse(data) 
    } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        return null;
    }
}

// Set item in localStorage
export function setLocalStorageItem(key, value) {
    try {
        const data = JSON.stringify(value);
        localStorage.setItem(key, data);
    } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
    }
}

// Remove item from localStorage
export function removeLocalStorageItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
    }
}
