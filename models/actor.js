import { createActor, waitFor } from "xstate";
import { TransitionError, ValidationError } from "../types/errors.js";
import { Validator } from "../utils";

class Actor {
  constructor(stateMachine, snapshot) {
    if (!stateMachine) {
      throw new ValidationError("Actor requires a state machine for creation");
    }

    this.stateMachine = stateMachine;
    this.snapshot = snapshot;
    this.actorInstance = createActor(stateMachine, { snapshot: this.snapshot });
  }

  start() {
    this.actorInstance.start();
  }

  subscribe(listeners = []) {
    if (!Array.isArray(listeners)) {
      throw new ValidationError("Listeners must be an array");
    }

    return listeners.map((listener) => {
      if (typeof listener !== "function") {
        throw new ValidationError("Each listener must be a function");
      }
      return this.actorInstance.subscribe(listener);
    });
  }

  async transition(transitionData) {
    try {
      Validator.validateTransition(transitionData);
    } catch (error) {
      if (error.name === "ValidationError") {
        throw new TransitionError("Invalid transition data", { transitionData, originalError: error });
      }
      throw error;
    }

    const { type, params, target } = transitionData;

    try {
      const previousSnapshot = this.actorInstance.getSnapshot();
      this.actorInstance.send({ type, params, target });

      const newSnapshot = await waitFor(this.actorInstance, (snapshot) => snapshot !== previousSnapshot);

      return newSnapshot;
    } catch (error) {
      throw new TransitionError(`State machine transition failed: ${type}`, {
        transitionData,
        originalError: error,
      });
    }
  }

  getSnapshot() {
    return this.actorInstance.getSnapshot();
  }
}

export default Actor;
