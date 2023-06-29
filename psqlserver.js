const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const { validateRecipe, getImageFromGoogle } = require('./utils/index');
dotenv.config();
const util = require('util');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());
app.use(express.json());

console.log(process.env.DBURL);

const db = new Pool({
  connectionString: process.env.DBURL || process.env.DATABASE_URL,
});

db.query = util.promisify(db.query);

app.post('/api/recipes', async (req, res) => {
  const recipe = req.body;
  if (!validateRecipe(recipe)) {
    res.status(400).json({ message: 'Invalid recipe' });
    return;
  }
  try {
    if (!recipe.image) {
      recipe.image = await getImageFromGoogle(recipe.name);
    }
    const result = await db.query('INSERT INTO recipes (name, description, image) VALUES ($1, $2, $3) RETURNING id', [
      recipe.name,
      recipe.description,
      recipe.image,
    ]);
    const recipeId = result.rows[0].id;

    for (const ingredient of recipe.ingredients) {
      await db.query('INSERT INTO ingredients (description, recipe_id) VALUES ($1, $2)', [ingredient, recipeId]);
    }

    let step = 1;
    for (const instruction of recipe.instructions) {
      await db.query('INSERT INTO instructions (step, description, recipe_id) VALUES ($1, $2, $3)', [step, instruction, recipeId]);
      step++;
    }

    res.json({ recipeId });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.put('/api/recipes/:recipe_id', async (req, res) => {
  const { recipe_id } = req.params;
  const recipe = req.body;
  if (!validateRecipe(recipe)) {
    res.status(400).json({ message: 'Invalid recipe' });
    return;
  }
  try {
    if (!recipe.image) {
      recipe.image = await getImageFromGoogle(recipe.name);
    }
    await db.query('UPDATE recipes SET name = $1, description = $2, image = $3 WHERE id = $4', [
      recipe.name,
      recipe.description,
      recipe.image,
      recipe_id,
    ]);
    await db.query('DELETE FROM ingredients WHERE recipe_id = $1', [recipe_id]);
    await db.query('DELETE FROM instructions WHERE recipe_id = $1', [recipe_id]);

    for (const ingredient of recipe.ingredients) {
      await db.query('INSERT INTO ingredients (description, recipe_id) VALUES ($1, $2)', [ingredient, recipe_id]);
    }

    let step = 1;
    for (const instruction of recipe.instructions) {
      await db.query('INSERT INTO instructions (step, description, recipe_id) VALUES ($1, $2, $3)', [step, instruction, recipe_id]);
      step++;
    }

    res.json({ message: 'Recipe updated' });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get('/api/recipes/:recipe_id', async (req, res) => {
  try {
    const { recipe_id } = req.params;
    const recipes = await db.query('SELECT * FROM recipes WHERE id = $1', [recipe_id]);
    if (recipes.rows.length) {
      const recipe = recipes.rows[0];
      recipe.ingredients = await db.query('SELECT description FROM ingredients WHERE recipe_id = $1', [recipe_id]);
      recipe.instructions = await db.query('SELECT * FROM instructions WHERE recipe_id = $1', [recipe_id]);
      res.json(recipe);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await db.query('SELECT * FROM recipes');
    res.json(recipes.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post('/api/ingredients', (req, res) => {
  const ingredient = req.body;
  db.query('INSERT INTO ingredients (description, recipe_id) VALUES ($1, $2)', [ingredient, ingredient.recipe], (err, results) => {
    if (err) {
      throw err;
    }
    res.send('Success!');
  });
});

app.post('/api/:recipe_id/ingredients', (req, res) => {
  const ingredients = req.body;
  const { recipe_id } = req.params;
  ingredients.forEach((ingredient) => {
    db.query('INSERT INTO ingredients (description, recipe_id) VALUES ($1, $2)', [ingredient, recipe_id], (err, results) => {
      if (err) {
        throw err;
      }
      res.send('Success!');
    });
  });
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const ingredients = await db.query('SELECT * FROM ingredients');
    res.json(ingredients.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get('/api/:recipe_id/ingredients', async (req, res) => {
  const { recipe_id } = req.params;
  db.query('SELECT * FROM ingredients WHERE recipe_id = $1', [recipe_id], (err, results) => {
    res.json(results.rows);
  });
});

app.delete('/api/:recipe_id', (req, res) => {
  const { recipe_id } = req.params;
  db.query('DELETE FROM recipes WHERE id = $1', [recipe_id], (err, results) => {
    if (err) {
      throw err;
    }
    res.send('Success!');
  });
});

app.post('/api/schema', async (req, res) => {
  try {
    await db.query('CREATE SCHEMA IF NOT EXISTS db');
    await db.query('SET search_path TO db');
    const createSchemaQuery = await util.promisify(fs.readFile)('db/schema.sql', 'utf8');
    await db.query(createSchemaQuery);
    res.send('Success!');
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post('/api/seed', async (req, res) => {
  const recipes = req.body.recipes || require('./utils/seed.json');
  console.log(recipes);
  try {
    for (const recipe of recipes) {
      if (!validateRecipe(recipe)) {
        res.status(400).json({ message: 'Invalid recipe' });
        return;
      }
      if (!recipe.image) {
        recipe.image = await getImageFromGoogle(recipe.name);
      }
      const result = await db.query('INSERT INTO recipes (name, description, image) VALUES ($1, $2, $3) RETURNING id', [
        recipe.name,
        recipe.description,
        recipe.image,
      ]);
      const recipeId = result.rows[0].id;

      for (const ingredient of recipe.ingredients) {
        await db.query('INSERT INTO ingredients (description, recipe_id) VALUES ($1, $2)', [ingredient, recipeId]);
      }

      let step = 1;
      for (const instruction of recipe.instructions) {
        await db.query('INSERT INTO instructions (step, description, recipe_id) VALUES ($1, $2, $3)', [step, instruction, recipeId]);
        step++;
      }
    }
    res.send('Success!');
  } catch (err) {
    res.status(500).json(err);
  }
});

app.listen(port);
