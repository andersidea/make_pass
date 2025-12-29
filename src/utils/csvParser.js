export const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    // Chrome/Whale CSV format usually: name,url,username,password
    // Or: url,username,password
    // We'll try to detect columns

    const items = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (doesn't handle quoted commas perfectly, but good enough for simple password exports)
        const values = line.split(',');

        // Heuristic mapping
        let url = values[1] || '';
        let username = values[2] || '';
        let password = values[3] || '';

        if (url && username && password) {
            items.push({
                type: 'password',
                title: new URL(url).hostname, // Use domain as title
                fields: {
                    id: username,
                    password: password,
                    url: url
                },
                createdAt: new Date().toISOString()
            });
        }
    }

    return items;
};
