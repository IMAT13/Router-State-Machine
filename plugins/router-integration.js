class RouterIntegration {
  constructor(router, stateMachine, options = {}) {
    this.router = router;
    this.stateMachine = stateMachine;
    this.entry = options.entry || "root";
    this.logger = options.logger;
  }

  createRouterConfig(payload) {
    const { name = "root" } = payload;
    return {
      name,
      query: { stateMachine: JSON.stringify(payload) },
    };
  }

  async push(payload) {
    try {
      const config = this.createRouterConfig(payload);
      await this.router.push(config);
      this.logger.debug("Router push completed", { payload, config });
    } catch (error) {
      this.logger.error("Router push failed", { payload, error });
      throw error;
    }
  }

  async replace(payload) {
    try {
      const config = this.createRouterConfig(payload);
      await this.router.replace(config);
      this.logger.debug("Router replace completed", { payload, config });
    } catch (error) {
      this.logger.error("Router replace failed", { payload, error });
      throw error;
    }
  }

  createGlobalInterface() {
    return {
      push: this.push.bind(this),
      replace: this.replace.bind(this),
    };
  }
}

export default RouterIntegration;
