# Import / Export Architecture

- Goal: keep the import/export UI reusable and easy to plug into any simulator.
- Use one shared component for the visible transfer box and controls.
- Each simulator decides on its own how export and import work internally.
- A simulator provides its own concrete codec implementation through the shared interface.
- The concrete export function collects the simulator data, compresses it as needed, and returns a Base64 string.
- The concrete import function takes the Base64 string, decodes and decompresses it, and rebuilds the simulator state.
- Compression strategy should stay inside the concrete simulator, because different simulators may need different optimizations.
- The shared layer should not assume one fixed serialization or compression format for all simulators.
- For simple simulators, export/import can be very direct.
- For compact transfer strings, a simulator can use stronger compression such as gzip.
- Result: shared UI, shared contract, simulator-specific encoding and decoding logic.
