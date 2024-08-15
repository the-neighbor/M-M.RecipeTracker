const util = require('util');
const mysql = require('mysql2');


function validateInstruction(instruction) {
    if (!instruction || !instruction.description) {
        return false;
    }
    return true;
}

function validateIngredient(ingredient) {
    if (!ingredient.description) {
        return false;
    }
    return true;
}

function validateRecipe(recipe) {
    if (!recipe.name || !recipe.description || !recipe.ingredients || !recipe.instructions) {
        console.log("1")
        return false;
    }
    if (!Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions)) {
        console.log("2")
        return false;
    }
    recipe.ingredients.forEach((ingredient) => {
        if (!validateIngredient(ingredient)) {
            console.log("3")
            return false;
        }
    }
    );
    recipe.instructions.forEach((instruction) => {
        if (!validateInstruction(instruction)) {
            console.log("4")
            return false;
        }
    }
    );
    return true;
}

async function getImageFromGoogle(searchTerm) {
    const result = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${searchTerm}&searchType=image`
    )
    const data = await result.json()
    if (data && data.items && data.items[0]){
        return(data.items[0].link);
    }


}


module.exports = { validateRecipe, validateIngredient, validateInstruction, getImageFromGoogle };