const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with Railway's PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false // Set to console.log to see SQL queries
});

// Define Post model
const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'posts',
    timestamps: true, // adds createdAt and updatedAt
    indexes: [
        {
            fields: ['date'],
            order: [['date', 'DESC']]
        },
        {
            fields: ['slug']
        }
    ]
});

// Generate slug from title and date
Post.beforeValidate((post) => {
    if (post.title && post.date) {
        const slug = post.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-');
        post.slug = slug;
        post.filename = `${post.date}-${slug}.md`;
    }
});

// Initialize database
async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Create tables if they don't exist
        await sequelize.sync();
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { Post, sequelize, initDatabase };