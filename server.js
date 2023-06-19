const express = require('express');
const mysql = require('mysql2');
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

const db = (process.env.DBURL ? mysql.createConnection(process.env.DBURL) : mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}, console.log('Connected to the recipe_db database.')))

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
        const returnValue = await db.query("INSERT INTO recipes VALUES(?, ?, ?, ?)", [0,recipe.name, recipe.description, recipe.image]);
        var recipe_id = returnValue.insertId;
        recipe.ingredients.forEach((ingredient)=>{
            console.log(recipe_id);
            console.log(ingredient);
            db.query("INSERT INTO ingredients VALUES(?, ?, ?)", [0, ingredient, recipe_id]);
        });
        var step = 1;
        recipe.instructions.forEach(async(instruction)=>{
            await db.query("INSERT INTO instructions VALUES(?, ?, ?, ?)", [0, step, instruction, recipe_id]);
            step++;
        });
        res.json({recipe_id});
    }
    catch (err) {
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
        await db.query("UPDATE recipes SET name = ?, description = ?, image = ? WHERE id = ?", [recipe.name, recipe.description, recipe.image, recipe_id]);
        await db.query("DELETE FROM ingredients WHERE recipe_id = ?", recipe_id);
        await db.query("DELETE FROM instructions WHERE recipe_id = ?", recipe_id);
        recipe.ingredients.forEach((ingredient)=>{
            db.query("INSERT INTO ingredients VALUES(?, ?, ?)", [0, ingredient, recipe_id]);
        }
        );
        var step = 1;
        recipe.instructions.forEach(async(instruction)=>{
            await db.query("INSERT INTO instructions VALUES(?, ?, ?, ?)", [0, step, instruction, recipe_id]);
            step++;
        }
        );
        res.json({message: 'Recipe updated'});
    } catch (err) {
        res.status(500).json(err);
    }
})


app.get('/api/recipes/:recipe_id', async (req, res) => {
    try {
        const { recipe_id } = req.params;
        const recipes = await db.query("SELECT * FROM recipes WHERE id = ?", [recipe_id])
        if (recipes.length) {
            const recipe = recipes[0];
            console.log(recipe_id, recipe)
            recipe.ingredients = await db.query("SELECT description FROM ingredients WHERE recipe_id = ?", [recipe_id])
            recipe.instructions = await db.query("SELECT * FROM instructions WHERE recipe_id = ?", [recipe_id])
            res.json(recipe);
            console.log(recipe);
        }
        else {
            res.status(404).json({ message: 'Recipe not found' });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

app.get('/api/recipes', (req, res) => {
    db.query("SELECT * FROM recipes", (err, results) =>
    {
        res.json(results)
    }) 
});



app.post('/api/ingredients', (req, res) => {
    const ingredient = req.body;
    db.query("INSERT INTO ingredients VALUES(?, ?, ?)", [0,ingredient,ingredient.recipe], (err, results) => {
        if (err) {
            throw(err)
        }
        res.send("Success!")
    }) 
})

app.post('/api/:recipe_id/ingredients', (req, res) => {
    const ingredients = req.body;
    const { recipe_id } = req.params;
    ingredients.forEach(ingredient => {
        db.query("INSERT INTO ingredients VALUES(?, ?, ?)", [0,ingredient, recipe_id], (err, results) => {
            if (err) {
                throw(err)
            }
            res.send("Success!")
        })
    }
    )
})

app.get('/api/ingredients', (req, res) => {
    db.query("SELECT * FROM ingredients", (err, results) =>
    {
        res.json(results)
    }) 
});

app.get("/api/:recipe_id/ingredients", (req, res) =>
{
    const { recipe_id } = req.params;
    console.log(req.params, recipe_id);
    db.query("SELECT * FROM ingredients WHERE recipe_id = ?", recipe_id, (err, results) => {
        res.json(results);
    })
})

app.delete('/api/:recipe_id', (req, res) => {
    const { recipe_id } = req.params;
    db.query("DELETE FROM recipes WHERE id = ?", recipe_id, (err, results) => {
        if (err) {
            throw(err)
            }
            res.send("Success!")
            })
        }
)

app.post('/api/seed' , (req, res) => {
    const recipes = req.body.recipes || require("./utils/seed.json");
    console.log(recipes);
    recipes.forEach(async (recipe) => {
        if (!validateRecipe(recipe)) {
            res.status(400).json({ message: 'Invalid recipe' });
            return;
        }
        try {
            if (!recipe.image) {
                recipe.image = await getImageFromGoogle(recipe.name);
            }
            const returnValue = await db.query("INSERT INTO recipes VALUES(?, ?, ?, ?)", [0,recipe.name, recipe.description, recipe.image]);
            var recipe_id = returnValue.insertId;
            recipe.ingredients.forEach((ingredient)=>{
                console.log(recipe_id);
                console.log(ingredient);
                db.query("INSERT INTO ingredients VALUES(?, ?, ?)", [0, ingredient, recipe_id]);
            });
            var step = 1;
            recipe.instructions.forEach(async(instruction)=>{
                await db.query("INSERT INTO instructions VALUES(?, ?, ?, ?)", [0, step, instruction, recipe_id]);
                step++;
            });
        }
        catch (err) {
            res.status(500).json(err);
        }
    })
    res.send("Success!")
}
)

app.listen(port);
