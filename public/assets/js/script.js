const modalAlertsEl = document.querySelector("#modal-alerts");
const modalEl = document.querySelector("#exampleModal");
const recipeContainerEl = document.querySelector("#recipe-container");
const recipeFormEl = document.querySelector("#recipe-form");
const recipeImageInputEl = document.querySelector("#recipe-image");


const deleteRecipe = (event) => {
  const recipeId = event.target.getAttribute("data-id");
  fetch(`/api/${recipeId}`, {
    method: "DELETE",
  }).then(location.reload());
};

function displayError(error) {
    modalAlertsEl.innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
    <strong>Holy guacamole!</strong> You should check in on some of those fields below.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
  `
}

function showRecipe(data) {
  console.log(data);
  const recipeName = document.querySelector("#show-recipe-title");
  recipeName.textContent = data.name;
  const recipeDescription = document.querySelector("#show-recipe-description");
  recipeDescription.textContent = data.description;
  const ingredientsList = document.querySelector("#ingredients-list");
  ingredientsList.innerHTML = "";
  const instructionsList = document.querySelector("#instructions-list");
  instructionsList.innerHTML = "";
  data.instructions.forEach((instruction) => {
    const instructionItem = document.createElement("li");
    instructionItem.classList.add("list-group-item");
    instructionItem.innerHTML = `
        <span>${instruction.description}</span>
        `;
    instructionsList.appendChild(instructionItem);
    data.ingredients.forEach((ingredient) => {
      const ingredientItem = document.createElement("li");
      ingredientItem.classList.add("list-group-item");
      ingredientItem.innerHTML = `
        <span>${ingredient.name}</span>
        <span>${ingredient.qty}</span>
        `;
      ingredientsList.appendChild(ingredientItem);
    });
  });
}

const fetchRecipe = async (recipeId) => {
  const response = await fetch(`/api/recipes/${recipeId}`);
  const data = await response.json();
  return data;
};


getIdFromCard = (element) => {
    while(element.classList && !element.classList.contains("card")) {
        element = element.parentElement;
    }
    const recipeId = element.getAttribute("data-id");
    return recipeId;
}


const getRecipe = (recipeId) => {
  fetchRecipe(recipeId).then((data) => showRecipe(data));
};

const getRecipes = () => {
    document.querySelector("#recipe-container").innerHTML = "";
  fetch("/api/recipes")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.forEach((recipe) => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("card");
        recipeCard.classList.add("col-12");
        recipeCard.classList.add("col-md-6");
        recipeCard.classList.add("m-2");
        recipeCard.setAttribute("data-id", recipe.id);
        recipeCard.innerHTML = `
                <img src="${recipe.image}" class="card-img-top" alt=${recipe.name}>
                <div class="card-body">
                    <h5 class="card-title
                    ">${recipe.name}</h5>
                    
                    <p class="card-text">${recipe.description}</p>
                    <button class="btn btn-secondary" data-id="${recipe.id}" data-bs-toggle="modal" data-bs-target="#exampleModal">Edit Recipe</button>
                    <button class="btn btn-danger" data-id="${recipe.id}">Delete</button>
                </div>
                `;
        recipeCard
          .querySelectorAll("button")[1]
          .addEventListener("click", deleteRecipe);
        console.log(recipeCard);
        recipeCard.addEventListener("click", selectRecipe);
        recipeCard
          .querySelectorAll("button")[0]
          .addEventListener("click", editRecipe);
        const recipeContainer = document.querySelector("#recipe-container");
        console.log(recipeContainer);
        recipeContainer.appendChild(recipeCard);
      });
    });
};

//remove ingredient input group from modal
const removeIngredient = (event) => {
  event.preventDefault();
  const ingredientInputGroup = event.target.parentElement;
  ingredientInputGroup.remove();
};

//remove instruction input group from modal
const removeInstruction = (event) => {
  event.preventDefault();
  const instructionInputGroup =
    event.target.parentElement.parentElement.parentElement;
  instructionInputGroup.remove();
};

//add instruction input group to modal
const addInstruction = (event) => {
  event.preventDefault();
  const instructionInputGroup = document.createElement("li");
  instructionInputGroup.classList.add("list-group-item");
  instructionInputGroup.classList.add("mb-3");
  instructionInputGroup.innerHTML = `
    <div class="input-group"> 
    <textarea class="form-control" placeholder="Instruction" aria-label="Instruction" aria-describedby="basic-addon1"></textarea>
    <div class="input-group-append">
        <button class="btn btn-danger" type="button">Remove</button>
    </div>
    </div>
    `;
  instructionInputGroup
    .querySelector("button")
    .addEventListener("click", removeInstruction);
  const instructionContainer = document.querySelector("#instructions-form");
  instructionContainer.appendChild(instructionInputGroup);
};

//add ingredient input group to modal
const addIngredient = (event) => {
  event.preventDefault();
  const ingredientInputGroup = document.createElement("li");
  ingredientInputGroup.classList.add("input-group");
  ingredientInputGroup.classList.add("mb-3");
  ingredientInputGroup.innerHTML = `
    <input type="text" class="form-control" placeholder="Ingredient" aria-label="Ingredient" aria-describedby="button-addon2">
    <input type="number" class="form-control" placeholder="Quantity" aria-label="Quantity" aria-describedby="button-addon2">
    <input type="text" class="form-control" placeholder="Unit" aria-label="Unit" aria-describedby="button-addon2">
    <button class="btn btn-outline-secondary" type="button" id="button-addon2">Button</button>
    `;
  const ingredientsList = document.querySelector("#ingredients");
  ingredientInputGroup
    .querySelector("button")
    .addEventListener("click", removeIngredient);
  ingredientsList.appendChild(ingredientInputGroup);
};

//get ingredients from input group
const getIngredient = (inputGroupElement) => {
  const inputs = inputGroupElement.querySelectorAll("input");
  const ingredientName = inputs[0].value;
  const ingredientQty = inputs[1].value;
  const ingredientUnit = inputs[2].value;
  return {
    name: ingredientName,
    qty: ingredientQty,
    unit: ingredientUnit
  };
}

//get instructions from input group
const getInstruction = (inputGroupElement) => {
  const instruction = inputGroupElement.querySelector("textarea").value;
  return instruction;
};

//add recipe and ingredients from modal to database
const addRecipe = async (event) => {
  event.preventDefault();
  const recipeName = document.querySelector("#recipe-name").value;
  const recipeImage = document.querySelector("#recipe-image").value;
  const recipeDescription = document.querySelector("#recipe-description").value;
  const ingredients = document.querySelectorAll("#ingredients .input-group");
  const instructions = document.querySelectorAll(
    "#instructions-form .input-group"
  );
  const instructionsArray = [];
  console.log(ingredients);
  const ingredientsArray = [];
  ingredients.forEach((ingredient) => {
    ingredientsArray.push(getIngredient(ingredient));
  });
  instructions.forEach((instruction) => {
    instructionsArray.push(getInstruction(instruction));
  });
  console.log(ingredientsArray);
  const response = await fetch("/api/recipes", {
    method: "POST",
    body: JSON.stringify({
      name: recipeName,
        image: recipeImage,
      description: recipeDescription,
      ingredients: ingredientsArray,
      instructions: instructionsArray,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    console.log("success");
  } else {
    displayError(response.statusText);
  }
  getRecipes();
  //location.reload();
};

const updateRecipe = async (event) => {
  event.preventDefault();
  recipeId = recipeFormEl.getAttribute("data-id");
  const recipeName = document.querySelector("#recipe-name").value;
  const recipeImage = document.querySelector("#recipe-image").value;
  const recipeDescription = document.querySelector("#recipe-description").value;
  const ingredients = document.querySelectorAll("#ingredients .input-group");
  const instructions = document.querySelectorAll(
    "#instructions-form .input-group"
  );
  const instructionsArray = [];
  console.log(ingredients);
  const ingredientsArray = [];
  ingredients.forEach((ingredient) => {
    ingredientsArray.push(getIngredient(ingredient));
  });
  instructions.forEach((instruction) => {
    instructionsArray.push(getInstruction(instruction));
  });
  console.log(instructionsArray)
  console.log(ingredientsArray);
  const response = await fetch("/api/recipes/" + recipeId, {
    method: "PUT",
    body: JSON.stringify({
      name: recipeName,
        image: recipeImage,
      description: recipeDescription,
      ingredients: ingredientsArray,
      instructions: instructionsArray,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    console.log("success");
  } else {
    displayError(response.statusText);
  }
  getRecipes();
  //location.reload();
};

async function editRecipe(event) {
  recipeForm = document.querySelector("#recipe-form");
  recipeForm.setAttribute("data-id", event.target.getAttribute("data-id"));
  recipeForm.reset();
  document.querySelector("#add-recipe").innerHTML = "Edit Recipe";
  document.querySelector("#add-recipe").addEventListener("click", updateRecipe);
  document.querySelector("#add-recipe").removeEventListener("click", addRecipe);
  const recipeId = event.target.getAttribute("data-id");
  const recipeNameEl = document.querySelector("#recipe-name");
  const recipeDescriptionEl = document.querySelector("#recipe-description");
  const ingredientsEl = document.querySelector("#ingredients");
  const instructionsEl = document.querySelector("#instructions-form");
  const recipe = await fetchRecipe(recipeId);
  recipeNameEl.value = recipe.name;
  recipeDescriptionEl.value = recipe.description;
  ingredientsEl.innerHTML = "";
  instructionsEl.innerHTML = "";
  recipe.ingredients.forEach((ingredient) => {
    const ingredientInputGroup = document.createElement("li");
    ingredientInputGroup.classList.add("input-group");
    ingredientInputGroup.classList.add("mb-3");
    ingredientInputGroup.innerHTML = `
        <input type="text" class="form-control" placeholder="Ingredient" aria-label="Ingredient" aria-describedby="button-addon2">
        <input type="number" class="form-control" placeholder="Quantity" aria-label="Quantity" aria-describedby="button-addon2">
        <input type="text" class="form-control" placeholder="Unit" aria-label="Unit" aria-describedby="button-addon2">
        <button class="btn btn-outline-secondary" type="button" id="button-addon2">Button</button>
        `;
    const inputs = ingredientInputGroup.querySelectorAll("input");
    inputs[0].value = ingredient.name;
    inputs[1].value = ingredient.qty;
    inputs[2].value = ingredient.unit;
    const ingredientsList = document.querySelector("#ingredients");
    ingredientInputGroup
      .querySelector("button")
      .addEventListener("click", removeIngredient);
    ingredientsList.appendChild(ingredientInputGroup);
  });
  recipe.instructions.forEach((instruction) => {
    const instructionInputGroup = document.createElement("li");
  instructionInputGroup.classList.add("list-group-item");
  instructionInputGroup.classList.add("mb-3");
  instructionInputGroup.innerHTML = `
    <div class="input-group"> 
    <textarea class="form-control" placeholder="Instruction" aria-label="Instruction" aria-describedby="basic-addon1"></textarea>
    <div class="input-group-append">
        <button class="btn btn-danger" type="button">Remove</button>
    </div>
    </div>
    `
    instructionInputGroup.querySelector("textarea").value =
      instruction.description;
    instructionInputGroup
      .querySelector("button")
      .addEventListener("click", removeInstruction);
    const instructionContainer = document.querySelector("#instructions-form");
    instructionContainer.appendChild(instructionInputGroup);
  });
}

async function newRecipe(event) {
  recipeForm = document.querySelector("#recipe-form");
  recipeForm.reset();
  document.querySelector("#add-recipe").innerHTML = "Add Recipe";
  document.querySelector("#add-recipe").removeEventListener("click", updateRecipe);
  document.querySelector("#add-recipe").addEventListener("click", addRecipe);
}

function climbToCard(element) {
    while (element.classList&& element.parentElement &&element.classList.contains("card") === false) {
        element = element.parentElement;
    }
    return element;
}

function deselectAllCards() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
        card.classList.remove("selected");
    });
}


async function selectRecipe(event) {
    deselectAllCards();
    const card = climbToCard(event.target);
    card.classList.toggle("selected");
    getRecipe(card.getAttribute("data-id"));
}


const addRecipeButton = document.querySelector("#add-recipe");
addRecipeButton.addEventListener("click", addRecipe);

const addIngredientButton = document.querySelector("#add-ingredient");
addIngredientButton.addEventListener("click", addIngredient);

const addInstructionButton = document.querySelector("#add-instruction");
addInstructionButton.addEventListener("click", addInstruction);

const newRecipeButton = document.querySelector("#new-recipe");
newRecipeButton.addEventListener("click", newRecipe);


getRecipes();