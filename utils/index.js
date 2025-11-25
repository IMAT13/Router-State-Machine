export { default as Logger } from "./logger.util.js";
export { default as StorageManager } from "./storage.util.js";
export { default as Validator } from "./validation.util.js";

const extractMostInnerState = (snapshot) => {
  if (typeof snapshot === "string") 
    return snapshot;
  
  return extractMostInnerState(Object.values(snapshot)[0]);
};

export { extractMostInnerState };
