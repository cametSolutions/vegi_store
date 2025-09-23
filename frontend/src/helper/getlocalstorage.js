function getLocalStorageItem(key){
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

export default getLocalStorageItem;
