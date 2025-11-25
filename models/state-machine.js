import { createMachine } from "xstate";
import { ConfigurationError } from "../types/errors.js";
import { Validator } from "../utils";

class StateMachine {
  constructor(config) {
    try {
      Validator.validateStateMachineConfig(config);
      this.machine = createMachine(config);
    } catch (error) {
      if (error.name === "ValidationError") {
        throw new ConfigurationError("Invalid state machine configuration", { config, originalError: error });
      }
      throw error;
    }
  }

  getInstance() {
    return this.machine;
  }
}

export default StateMachine;
