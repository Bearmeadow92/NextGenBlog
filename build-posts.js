const fs = require('fs');

// Read all markdown files from posts folder
const posts = [];

try {
    const files = fs.readdirSync('./posts');
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const content = fs.readFileSync(`./posts/${file}`, 'utf8');
            
            // Extract title, date, description from the markdown
            const titleMatch = content.match(/title:\s*"?([^"]*)"?/);
            const dateMatch = content.match(/date:\s*([^\n]*)/);
            const descMatch = content.match(/description:\s*"?([^"]*)"?/);
            
            if (titleMatch && dateMatch && descMatch) {
                posts.push({
                    title: titleMatch[1].trim(),
                    date: dateMatch[1].trim(),
                    description: descMatch[1].trim(),
                    filename: file
                });
            }
        }
    });
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Write to posts.json
    fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));
    console.log(`Generated posts.json with ${posts.length} posts`);
    
} catch (error) {
    console.error('Error:', error.message);
}