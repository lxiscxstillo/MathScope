# **App Name**: MultiCalc Pro

## Core Features:

- Function Input and Validation: Allows users to input mathematical functions with real-time syntax validation. Supports standard mathematical notations and functions. Validates as the user types.
- Interactive 2D/3D Visualization: Generates interactive 2D and 3D plots of input functions, including surface plots and contour plots. Provides tools for rotation, zoom, and slicing. Displays gradient vectors on user request at specific points on the graph.
- Domain and Range Calculation: Estimates the domain and range of input functions numerically. Provides a clear visualization of the domain and range on the graph.
- Partial Derivative and Gradient Calculation: Calculates partial derivatives and gradients of input functions. Presents the results both numerically and visually (as vectors on the graph).
- History: Save calculation parameters to localstorage (function, graph settings, calculated results), to enable continuation across browser sessions.
- Formula Explanation Tool: Uses a tool, with an LLM and a collection of web resources as references, to find and present descriptions of the different mathematical formulas, in the users own language, used in MultiCalc Pro's mathematical calculations.
- Optimization with Constraints (Lagrange Multipliers): Solves optimization problems with equality constraints using Lagrange multipliers. Provides numerical results and visualizes constraint surfaces together with optimal points.
- Multiple Integration (Double and Triple Integrals): Performs double and triple integrals of input functions over user-defined regions. Calculates values such as volume, mass, or center of mass, and displays the corresponding 3D regions in the visualization panel.
- Guided Calculation Mode: Provides a step-by-step explanation of the mathematical process (derivations, integrations, optimizations) using symbolic computation. Renders intermediate steps and formulas in LaTeX for clarity, complementing the automatic direct results.
- Export of Results: Allows users to export numerical results, step-by-step explanations, and graphs. Supports exporting to PDF (for full reports) and PNG (for images of graphs).
- Demo / Presentation Mode: Includes a dedicated mode for classroom presentations. Loads predefined examples, automatically generates visualizations and explanations, and guides the user through an interactive demo suitable for 10–15 minute academic presentations.

## Style Guidelines:

- Primary color: Vibrant blue (#0B74FF) to provide a sense of trust and precision, aligning with the app's core function of calculation and analysis.
- Background color: Light blue (#F0F8FF), nearly the same hue as the primary color, creates a soft and clean backdrop that does not distract from the mathematical content.
- Accent color: Purple (#BE4BFE), analogous to the primary hue, offers a contrasting highlight for interactive elements and calls to action.
- Body text and headlines: 'Inter', a grotesque sans-serif typeface known for its modern, neutral, and objective appearance; ideal for on-screen readability.
- Code font: 'Source Code Pro' monospaced typeface for code snippets.
- The interface should feature clear and intuitive layouts, maximizing screen real estate to display both the function editor and the interactive graph simultaneously. Use TailwindCSS and Headless UI.
- Employ subtle animations (under 200ms) for transitions and interactive feedback, providing a smooth and engaging user experience.