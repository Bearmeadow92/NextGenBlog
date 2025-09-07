const fs = require('fs');

// Read all markdown files from posts folder
const posts = [];

try {
    const files = fs.readdirSync('./posts');
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const content = fs.readFileSync(`./posts/${file}`, 'utf8');
            
            // Extract frontmatter (the stuff between --- and ---)
            const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
            
            if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1];
                const lines = frontmatter.split('\n');
                const post = { filename: file };
                
                lines.forEach(line => {
                    if (line.includes('title:')) {
                        post.title = line.split('title:')[1].trim().replace(/"/g, '');
                    }
                    if (line.includes('date:')) {
                        post.date = line.split('date:')[1].trim();
                    }
                    if (line.includes('description:')) {
                        post.description = line.split('description:')[1].trim().replace(/"/g, '');
                    }
                });
                
                // Only add posts that have all required fields
                if (post.title && post.date && post.description) {
                    posts.push(post);
                }
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