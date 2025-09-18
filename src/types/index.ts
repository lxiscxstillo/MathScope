// This file can be used to define shared types across your application.

// For example, the structure of a history item:
export type HistoryItem = {
    id: string;
    function: string;
    timestamp: string;
    graphSettings: {
        zoom: number;
        rotation: [number, number, number];
    };
    // ... other properties
};
