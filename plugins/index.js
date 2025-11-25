import { StateMachineManager } from "../services";
import { extractMostInnerState, Logger } from "../utils";
import registerStateMachineGuard from "./guard.js";
import RouterIntegration from "./router-integration.js";

let stateMachine = null;
let routerIntegration = null;
const snapshot = ref(null);

export default {
  async install(_, options = {}) {
    const logger = new Logger({ ...options.logger, debug: options.debug });
    try {
      stateMachine = new StateMachineManager({ ...options, logger, snapshot });

      stateMachine.addListeners([
        (newSnapshot) => {
          snapshot.value = newSnapshot;
        },
      ]);

      if (options.router) {
        routerIntegration = new RouterIntegration(options.router, stateMachine, {
          entry: options.entry,
          logger,
        });

        registerStateMachineGuard(options.router, stateMachine, {
          entry: options.entry,
          logger,
        });
      }

      logger.info("State machine plugin installed successfully", {
        hasRouter: !!options.router,
        entry: options.entry,
      });
    } catch (error) {
      logger.error("Failed to install state machine plugin", { error });
      throw error;
    }
  },
};

export const getStateMachine = () => stateMachine;
export const useNavigator = () => {
  return {
    ...routerIntegration?.createGlobalInterface(),
    snapshot,
    name: computed(() => extractMostInnerState(snapshot.value)),
    useTransitionAllowed: (transition) => {
      return computed(() => snapshot.value.can({ type: transition }));
    },
  };
};
