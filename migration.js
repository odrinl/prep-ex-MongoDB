const mysql = require('mysql');
const { MongoClient, ObjectId } = require('mongodb');

// MySQL configuration
const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'hyfuser',
  password: 'hyfpassword',
  database: 'userdb',
};

// MongoDB connection URL
const mongoUrl = 'mongodb+srv://hyfuser:hyfpassword@cluster0.osskrn7.mongodb.net/userdb?retryWrites=true&w=majority';
const dbName = 'userdb';

// Define the fetchMySQLData function before migrateData
async function fetchMySQLData(connection, tableName) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM ${tableName}`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function fetchRecipeIngredients(recipeID, connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT ingredients.IngredientName, recipe_ingredients.QuantityValue, recipe_ingredients.UnitName
       FROM recipe_ingredients
       JOIN ingredients ON recipe_ingredients.IngredientID = ingredients.id
       WHERE recipe_ingredients.RecipeID = ?`,
      [recipeID],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          const ingredients = results.map((row) => ({
            IngredientName: row.IngredientName,
            QuantityValue: row.QuantityValue,
            UnitName: row.UnitName,
          }));
          resolve(ingredients);
        }
      }
    );
  });
}

async function fetchRecipeSteps(recipeID, connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT steps.StepDescription
       FROM recipe_steps
       JOIN steps ON recipe_steps.StepID = steps.StepID
       WHERE recipe_steps.RecipeID = ?
       ORDER BY recipe_steps.StepOrder`,
      [recipeID],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          const steps = results.map((row) => ({
            StepDescription: row.StepDescription,
          }));
          resolve(steps);
        }
      }
    );
  });
}


async function insertMongoDBData(db, collectionName, data) {
  const collection = db.collection(collectionName);
  await collection.insertMany(data);
}

async function migrateData() {
  let mysqlConnection;
  let mongoClient;

  try {
    // Connect to MySQL
    mysqlConnection = mysql.createConnection(mysqlConfig);
    mysqlConnection.connect();

    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const db = mongoClient.db(dbName);

    // Migrate 'recipes' table
    const recipesData = await fetchMySQLData(mysqlConnection, 'recipes');

    // Migrate 'categories' table to MongoDB
    const categoriesData = await fetchMySQLData(mysqlConnection, 'categories');
    const categoriesCollection = db.collection('categories');
    await categoriesCollection.insertMany(categoriesData);

    // Transform and insert 'recipes' data into MongoDB
    const recipesWithDetails = await Promise.all(
      recipesData.map(async (recipe) => {
        const recipeId = recipe.id;
        const ingredientsData = await fetchRecipeIngredients(recipeId, mysqlConnection);
        const stepsData = await fetchRecipeSteps(recipeId, mysqlConnection);
        const categoriesData = await fetchRecipeCategories(recipeId, mysqlConnection);

        const recipeObj = {
          _id: new ObjectId(), // Generate a new ObjectId for each recipe
          RecipeName: recipe.RecipeName,
          Ingredients: ingredientsData,
          Steps: stepsData,
          Categories: categoriesData,
        };

        return recipeObj;
      })
    );


    await insertMongoDBData(db, 'recipes', recipesWithDetails);

    console.log('Data migration completed successfully.');
  } catch (error) {
    console.error('Error migrating data:', error);
  } finally {
    // Close MySQL connection if it's open
    if (mysqlConnection && mysqlConnection.state !== 'disconnected') {
      mysqlConnection.end();
    }
    // Close MongoDB client
    if (mongoClient) {
      mongoClient.close();
    }
  }
}


async function fetchRecipeCategories(recipeID, connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT CategoryID FROM categories 
       INNER JOIN recipe_categories ON categories.id = recipe_categories.CategoryID 
       WHERE recipe_categories.RecipeID = ?`,
      [recipeID],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          const categoryIds = results.map((row) => row.CategoryID);
  resolve(categoryIds);
        }
      }
    );
  });
}

migrateData();