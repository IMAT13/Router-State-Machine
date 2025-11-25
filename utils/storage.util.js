import { StorageError } from "../types/errors.js";

class StorageManager {
  constructor(storage, persist = false, logger = null) {
    this.storage = storage;
    this.persist = persist;
    this.logger = logger;
  }

  getItem(key) {
    if (!this.persist || !this.storage) {
      return null;
    }

    try {
      const value = this.storage.getItem(key);
      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch (parseError) {
        this.logger.warn(`Failed to parse stored value for key: ${key}`, { parseError });
        return null;
      }
    } catch (error) {
      this.logger.error(`Failed to get item from storage: ${key}`, { error });
      throw new StorageError(`Storage getItem failed for key: ${key}`, { key, error });
    }
  }

  setItem(key, value) {
    if (!this.persist || !this.storage) {
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
      this.logger.debug(`Stored item: ${key}`, { value });
    } catch (error) {
      this.logger.error(`Failed to set item in storage: ${key}`, { error, value });
      throw new StorageError(`Storage setItem failed for key: ${key}`, { key, value, error });
    }
  }

  removeItem(key) {
    if (!this.persist || !this.storage) {
      return;
    }

    try {
      this.storage.removeItem(key);
      this.logger.debug(`Removed item: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to remove item from storage: ${key}`, { error });
      throw new StorageError(`Storage removeItem failed for key: ${key}`, { key, error });
    }
  }

  clear() {
    if (!this.persist || !this.storage) {
      return;
    }

    try {
      this.storage.clear();
      this.logger.debug("Storage cleared");
    } catch (error) {
      this.logger.error("Failed to clear storage", { error });
      throw new StorageError("Storage clear failed", { error });
    }
  }

  hasItem(key) {
    return this.getItem(key) !== null;
  }
}

export default StorageManager;
