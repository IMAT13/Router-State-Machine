import { ValidationError } from "../types/errors.js";

class Validator {
  static isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  static isFunction(value) {
    return typeof value === "function";
  }

  static isString(value) {
    return typeof value === "string";
  }

  static isBoolean(value) {
    return typeof value === "boolean";
  }

  static isStorage(storage) {
    return (
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function"
    );
  }

  static validateStateMachineConfig(config) {
    if (!this.isObject(config)) {
      throw new ValidationError("State machine config must be an object", { config });
    }

    if (config.states && !this.isObject(config.states)) {
      throw new ValidationError("States must be an object", { states: config.states });
    }

    if (config.initial && !this.isString(config.initial)) {
      throw new ValidationError("Initial state must be a string", { initial: config.initial });
    }

    return true;
  }

  static validateTransition(transition) {
    if (!this.isObject(transition)) {
      throw new ValidationError("Transition must be an object", { transition });
    }

    if (!transition.type || !this.isString(transition.type)) {
      throw new ValidationError("Transition type is required and must be a string", { transition });
    }

    return true;
  }

  static validateStorageConfig(storage, persist) {
    if (persist && !this.isStorage(storage)) {
      throw new ValidationError("Storage must implement getItem, setItem, and removeItem methods", {
        storage,
      });
    }

    if (!this.isBoolean(persist)) {
      throw new ValidationError("Persist must be a boolean", { persist });
    }

    return true;
  }
}

export default Validator;
