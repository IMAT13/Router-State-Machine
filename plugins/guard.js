class RouterGuard {
  constructor(router, stateMachine, options = {}) {
    this.router = router;
    this.stateMachine = stateMachine;
    this.entry = options.entry || "root";
    this.logger = options.logger;
    this.initialTransition = { type: "NEXT" };
    this.isBackNavigation = false;
  }

  handleNavigation(to, from) {
    try {
      const currentSnapshot = this.getCurrentSnapshot();

      this.isBackNavigation = this.detectBackNavigation(to, from);

      if (this.shouldSkipTransition(to, currentSnapshot)) {
        return true;
      }

      const transitionData = this.extractTransitionData(to);

      if (this.isValidTransition(transitionData)) {
        this.executeTransition(transitionData, to.name);
      }

      return this.determineNavigationResult(to);
    } catch (error) {
      this.logger.error("Router guard error", { error, route: to.name });
    }
  }

  getCurrentSnapshot() {
    const snapshot = this.stateMachine.getSnapshot()?.value;
    return this.extractMostInnerState(snapshot);
  }

  extractMostInnerState(snapshot) {
    if (typeof snapshot === "string") return snapshot;

    return this.extractMostInnerState(Object.values(snapshot)[0]);
  }

  shouldSkipTransition(to, currentSnapshot) {
    return to.name === currentSnapshot && to.name !== this.entry;
  }

  extractTransitionData(to) {
    const { stateMachine } = to?.query ?? {};

    const fallBackTransition = to.name === this.entry ? this.initialTransition : null;
    return this.parseQueryTransition(stateMachine) ?? fallBackTransition;
  }

  parseQueryTransition(stateMachineQuery) {
    if (!stateMachineQuery) return null;

    try {
      return JSON.parse(stateMachineQuery);
    } catch (parseError) {
      this.logger.warn("Failed to parse stateMachine data from query", {
        query: stateMachineQuery,
        error: parseError,
      });
      return null;
    }
  }

  isValidTransition(transitionData) {
    return transitionData && !!transitionData.type;
  }

  executeTransition(transitionData, routeName) {
    try {
      this.stateMachine.transition({ ...transitionData });
      this.logger.debug("State machine transition completed", {
        transition: transitionData,
        route: routeName,
      });
    } catch (transitionError) {
      this.logger.error("State machine transition failed", {
        transition: transitionData,
        error: transitionError,
      });
    }
  }

  detectBackNavigation(to, from) {
    const hasStateMachineQuery = to?.query?.stateMachine;
    const isNavigatingBack = !hasStateMachineQuery && from?.name;

    this.logger.debug("Navigation detection", {
      to: to.name,
      from: from?.name,
      hasStateMachineQuery: !!hasStateMachineQuery,
      isBackNavigation: isNavigatingBack,
    });

    return isNavigatingBack;
  }

  determineNavigationResult(to) {
    const currentState = this.getCurrentSnapshot();
    const { stateMachine: _, ...rest } = to?.query ?? {};

    if (this.isBackNavigation) {
      this.logger.debug("Browser back navigation detected, allowing navigation", {
        targetRoute: to.name,
        currentState,
      });
      return false;
    }

    if (to.name !== currentState) {
      this.logger.debug("Route mismatch, Navigation cancelled", {
        expectedRoute: to.name,
        currentState,
      });
      return { name: currentState, query: { ...rest } };
    }
    return false;
  }

  register() {
    this.router.beforeEach((to, from) => this.handleNavigation(to, from));
  }
}

export default (router, stateMachine, options = {}) => {
  new RouterGuard(router, stateMachine, options).register();
};
