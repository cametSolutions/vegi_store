// Get item from localStorage
export function getLocalStorageItem<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    if (!data) {
        return null;
    }
    try {
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        return null;
    }
}

// Set item in localStorage
export function setLocalStorageItem<T>(key: string, value: T): void {
    try {
        const data = JSON.stringify(value);
        localStorage.setItem(key, data);
    } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
    }
}

// Remove item from localStorage
export function removeLocalStorageItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
    }
}
