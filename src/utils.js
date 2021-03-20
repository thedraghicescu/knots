const isValidKeyString = function(key){
    return (
        typeof key === "string" 
        && key.trim().length > 0   //must not be empty
        && key.indexOf('.')  < 0   //must not contain '.' because it's used as namespace
    );
}
const isValidKeyNumber = function(key){
    return (
        Number.isSafeInteger(key) 
        && ( key > 0 || 1 / key === Number.POSITIVE_INFINITY) // bigger than negative zero
    )
}
const isValidKey = function(key){
    if(key==null) return false;
    return  isValidKeyNumber(key) || isValidKeyString(key)
    
}

const findObjectFromPath = function(mainObj,path){
    if(!Array.isArray(path)) throw new Error("Path must be an array");
    if(!mainObj) throw new Error("Obj cannot be null")
    if(path.length<1) throw ("Path must have at least one element")
    let found = mainObj;
    for (const part of path) {
        if(!found[part]) return null;
        found = found[part];
    }
    

    return found;
}



exports.isValidKey = isValidKey;
exports.findObjectFromPath = findObjectFromPath;