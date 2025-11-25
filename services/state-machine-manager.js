import { Actor, StateMachine } from "../models";
import { ConfigurationError, StateMachineError } from "../types/errors.js";
import { StorageManager } from "../utils";
import ConfigurationManager from "./configuration-manager.js";

class StateMachineManager {
  constructor(options = {}) {
    this.logger = options.logger;
    this.storageManager = new StorageManager(options.storage, options.persist, this.logger);
    this.configManager = new ConfigurationManager();

    this.states = options.states || {};
    this.config = options.config || {};
    this.entry = options.entry || "root";
    this.listeners = [];

    this._CONFIG_KEY = "STATE_MACHINE_CONFIG";
    this._SNAPSHOT_KEY = "STATE_MACHINE_SNAPSHOT";

    this._initialize();
  }

  _initialize() {
    try {
      const { snapshot, states } = this._loadPersistedConfiguration();
      this._buildStateMachine(states, snapshot);
      this._setupSnapshotPersistence();
      this.actor.start();

      this.logger.info("State machine initialized", {
        entry: this.entry,
        statesCount: Object.keys(this.states).length,
      });
    } catch (error) {
      this.logger.error("Failed to initialize state machine", { error });
      throw new StateMachineError("State machine initialization failed", { originalError: error });
    }
  }

  _loadPersistedConfiguration() {
    const savedStates = this.storageManager.getItem(this._CONFIG_KEY);
    const savedSnapshot = this.storageManager.getItem(this._SNAPSHOT_KEY);

    return {
      states: savedStates || this.states,
      snapshot: savedSnapshot,
    };
  }

  _buildStateMachine(states, snapshot) {
    try {
      const config = this.configManager.buildStateMachineConfig(states, this.config, this.entry);
      this.stateMachine = new StateMachine(config).getInstance();
      this.actor = new Actor(this.stateMachine, snapshot);
    } catch (error) {
      this.logger.error("Failed to build state machine", { error, states, config: this.config });
      throw new ConfigurationError("State machine configuration is invalid", { originalError: error });
    }
  }

  _setupSnapshotPersistence() {
    this.addListeners([
      (snapshot) => {
        this.storageManager.setItem(this._SNAPSHOT_KEY, snapshot);
        this.logger.debug("Snapshot persisted", { snapshot });
      },
    ]);
  }

  _determineInitialState(location) {
    const hash = location.hash || "";
    const path = hash.replace("_/", "");
    const initialState = path.split("/")[0].split("?")[0];
    return initialState || this.entry;
  }

  addListeners(newListeners = []) {
    if (!Array.isArray(newListeners)) {
      throw new Error("Listeners must be an array");
    }

    this.listeners = [...this.listeners, ...newListeners];
    return this.actor.subscribe(newListeners);
  }

  async transition(transitionData) {
    try {
      const snapshot = await this.actor.transition(transitionData);
      this.logger.info("State transition completed", { transitionData, snapshot });
      return snapshot;
    } catch (error) {
      this.logger.error("State transition failed", { transitionData, error });
      throw error;
    }
  }

  getSnapshot() {
    return this.actor.getSnapshot();
  }

  getStates() {
    return { ...this.states };
  }

  update(newStates) {
    try {
      this.states = deepMerge(this.states, newStates);
      this.storageManager.setItem(this._CONFIG_KEY, this.states);

      const snapshot = this.storageManager.getItem(this._SNAPSHOT_KEY) || this.actor.getSnapshot();
      this._buildStateMachine(this.states, snapshot);
      this.addListeners(this.listeners);
      this._setupSnapshotPersistence();
      this.actor.start();

      this.logger.info("States updated", { newStates, totalStates: Object.keys(this.states).length });
    } catch (error) {
      this.logger.error("Failed to update states", { error, newStates });
      throw new StateMachineError("Failed to update states", { originalError: error });
    }
  }

  resetPersistence() {
    this.storageManager.removeItem(this._CONFIG_KEY);
    this.storageManager.removeItem(this._SNAPSHOT_KEY);
    this.logger.info("Persistence reset");
  }

  destroy() {
    if (this.actor) {
      this.actor.start = () => {};
    }
    this.logger.info("State machine destroyed");
  }
}

export default StateMachineManager;
