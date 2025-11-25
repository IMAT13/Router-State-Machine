import { ConfigurationError } from "../types/errors.js";
import { Validator } from "../utils";

class ConfigurationManager {
  constructor() {
    this.defaultConfig = {
      context: {},
      actions: {},
      actors: {},
      guards: {},
      delays: {},
      always: {
        actions: ({ context, event }) => {
          if (event.params) {
            Object.assign(context, event.params);
          }
        },
      },
    };
  }

  mergeConfigs(baseConfig = {}, userConfig = {}) {
    try {
      Validator.isObject(baseConfig);
      Validator.isObject(userConfig);
    } catch {
      throw new ConfigurationError("Configs must be objects", { baseConfig, userConfig });
    }

    return this._deepMerge(baseConfig, userConfig);
  }

  buildStateMachineConfig(states, config, entry) {
    if (!states || typeof states !== "object") {
      throw new ConfigurationError("States must be provided and must be an object", { states });
    }

    if (!entry || typeof entry !== "string") {
      throw new ConfigurationError("Entry state must be provided and must be a string", { entry });
    }

    const mergedConfig = this.mergeConfigs(this.defaultConfig, config);

    return {
      ...mergedConfig,
      states,
      initial: entry,
    };
  }

  _deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          result[key] = this._deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }
}

export default ConfigurationManager;
