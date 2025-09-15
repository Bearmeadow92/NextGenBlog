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
    logging: false
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
    timestamps: true
});

// SIMPLE Message model - only essential fields
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'messages',
    timestamps: true
});

// Generate slug from title and date for posts
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
        
        // IMPORTANT: alter: true will add missing columns
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
        
        console.log('Database connected successfully');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

module.exports = {
    Post,
    Message,
    initDatabase,
    sequelize
};