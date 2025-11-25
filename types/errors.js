class StateMachineError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = "StateMachineError";
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

class ConfigurationError extends StateMachineError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "ConfigurationError";
  }
}

class TransitionError extends StateMachineError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "TransitionError";
  }
}

class StorageError extends StateMachineError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "StorageError";
  }
}

class ValidationError extends StateMachineError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "ValidationError";
  }
}

export { ConfigurationError, StateMachineError, StorageError, TransitionError, ValidationError };
