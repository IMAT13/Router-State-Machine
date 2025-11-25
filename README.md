# Router-State-Machine

> A pragmatic wrapper around [XState](https://xstate.js.org/) with first-class Vue 3 + Vue Router integration.

This package bundles everything you need to centralize view navigation inside a deterministic state machine. It exposes bare utility classes for framework-agnostic usage, plus a Vue plugin that wires the machine into Router navigation guards, snapshot persistence, and ergonomic composition helpers.

## Features

- XState 5 powered machine/actor wrapper with validation and error types
- Declarative configuration builder with sensible defaults (`always` action merges params into context)
- Persisted snapshots and state definitions via pluggable storage (e.g., `localStorage`)
- Optional Vue plugin that:
  - Installs a single shared `StateMachineManager`
  - Synchronizes Router navigation (push/replace) through machine transitions
  - Guards routes to keep the URL aligned with the active state
  - Exposes a `useNavigator()` helper for components/composables
- Structured logging with adjustable verbosity for debugging flows

## Installation

```bash
pnpm add state-machine
# or
npm install state-machine
```

The package ships pre-bundled ESM. Node 18+ / modern bundlers are recommended.

## Core Building Blocks

- `StateMachine` wraps `createMachine` and validates configuration before instantiation.
- `Actor` encapsulates an XState actor, enforces transition payloads, and surfaces async `transition()` returning the next snapshot.
- `StateMachineManager` orchestrates configuration, persistence, listeners, and state updates.

### Constructing a Manager Manually

```js
import { StateMachineManager } from "state-machine";

const states = {
  idle: { on: { NEXT: "details" } },
  details: { on: { SUBMIT: { target: "confirm", actions: ["save"] } } },
  confirm: { on: { RESET: "idle" } },
};

const manager = new StateMachineManager({
  states,
  entry: "idle",
  config: {
    actions: {
      save: ({ context, event }) => {
        // custom side effects
      },
    },
  },
  persist: true,
  storage: window.localStorage,
  logger: { prefix: "[CheckoutSM]", level: 3 },
});

manager.addListeners([
  (snapshot) => console.log("state changed →", snapshot.value),
]);

await manager.transition({ type: "NEXT" });
```

### Persistence

Pass a storage implementation (anything exposing `getItem`, `setItem`, `removeItem`) and `persist: true` to automatically:

- cache merged state definitions (`STATE_MACHINE_CONFIG`)
- restore the last snapshot (`STATE_MACHINE_SNAPSHOT`)
- keep snapshots synced whenever they change

Call `manager.resetPersistence()` or `storage.clear()` when you need to wipe cached data.

## Vue Plugin Integration

```js
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import StateMachinePlugin from "state-machine";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { name: "idle", path: "/idle", component: () => import("./Idle.vue") },
    { name: "details", path: "/details", component: () => import("./Details.vue") },
    { name: "confirm", path: "/confirm", component: () => import("./Confirm.vue") },
  ],
});

const app = createApp(App);

app.use(StateMachinePlugin, {
  states,
  entry: "idle",
  router,
  persist: true,
  storage: window.localStorage,
  debug: import.meta.env.DEV,
  logger: { prefix: "[CheckoutSM]" },
});

app.use(router);
app.mount("#app");
```

### What the Plugin Does

```51:55:plugins/index.js
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
```

- Instantiates a single `StateMachineManager`, keeping its snapshot in a global Vue `ref`.
- Registers `beforeEach` guards to ensure Router routes stay aligned with the active machine state.
- Exposes navigation helpers (`push`, `replace`) that automatically serialize transition payloads into `route.query.stateMachine`.
- Provides computed helpers for components to read the current state and check `can` transitions reactively.

### Using `useNavigator` inside Components

```vue
<script setup>
import { useNavigator, getStateMachine } from "state-machine";

const navigator = useNavigator();
const stateMachine = getStateMachine();

const goNext = async () => {
  if (navigator.useTransitionAllowed("NEXT").value) {
    await stateMachine.transition({ type: "NEXT", params: { step: 2 } });
    await navigator.push({ name: navigator.name.value });
  }
};
</script>
```

## Router Guard Behavior

```12:122:plugins/guard.js
handleNavigation(to, from) {
  // ...
  const transitionData = this.extractTransitionData(to);
  if (this.isValidTransition(transitionData)) {
    this.executeTransition(transitionData, to.name);
  }
  return this.determineNavigationResult(to);
}
```

- Reads serialized transition data from the route query and fires it through the manager.
- Detects browser back navigation and lets it proceed without cancelling.
- Cancels forward navigation when the requested route does not match the machine's current state, redirecting to the correct one instead.

## Accessing the Manager Outside Components

Use the named export `getStateMachine()` after the plugin installs to access the shared manager (e.g., inside Pinia stores or standalone modules).

```js
import { getStateMachine } from "state-machine";

const machine = getStateMachine();
machine.transition({ type: "RESET" });
```

## Logging

The built-in logger (`utils/logger.util.js`) supports `error`, `warn`, `info`, and `debug` with a configurable prefix and level. Set `debug: false` in plugin options to reduce noise in production.

## Error Types

All custom errors inherit from `StateMachineError` (`ConfigurationError`, `TransitionError`, `StorageError`, `ValidationError`). These include a `context` payload and ISO timestamp to make troubleshooting transitions and configuration issues easier.

---

Need an example or more detail? Open an issue or extend the README with your project-specific flows. Happy state managing!