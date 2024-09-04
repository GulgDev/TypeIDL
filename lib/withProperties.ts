export const withProperties = (object: any, properties: Record<string, any>, callback: () => void) => {
    const originalProperties = Object.fromEntries(
        Object.entries(properties)
            .map(([key]) => [key, object[key]])
    );
    Object.assign(object, properties);
    try {
        callback();
    } finally {
        Object.assign(object, originalProperties);
    }
};