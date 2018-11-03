const env = require('../db_config.js').environment;
const options = require('../knexfile')[env];
const parse = require('../helpers/parsers.js');
const knex = require('knex')(options);

// EXAMPLE DATABASE ACCESS FUNCTION:
//
//module.exports.checkAccess = function(id) {
//  return knex
//     .select()
//     .from('sample')
//    // .where({id})
//};

module.exports.fetchRecipeList = function(userId) {
  //return a list of short recipe descriptions
  return knex.select()
  .from('recipes')
  .where({'userId': userId});
};


module.exports.fetchRecipeById = function(recipeId) {
  //return the recipe and all relevant accompanying information
  
  const queriesNeeded = [
    knex.select('*').from('recipes').where({id: recipeId}),
    knex.select({
        quantity: 'recipe_ingredients.quantity',
        position: 'recipe_ingredients.list_position',
        ndbno: 'ingredients.ndbno',
        name: 'ingredients.name',
        stdAmount: 'ingredients.std_amount',
        kcalPer: 'ingredients.kcal_per',
        fatPer: 'ingredients.fat_per',
        satFatPer: 'ingredients.sat_fat_per',
        fiberPer: 'ingredients.fiber_per',
        cholesterolPer: 'ingredients.cholesterol_per',
        sodiumPer: 'ingredients.sodium_per',
        carbsPer: 'ingredients.carbs_per',
        sugarPer: 'ingredients.sugar_per',
        proteinPer: 'ingredients.protein_per'
      })
      .from('recipe_ingredients')
      .join('ingredients', 'recipe_ingredients.food_no', '=', 'ingredients.ndbno')
      .where({'recipe_ingredients.recipe_id': recipeId})
      .orderBy('recipe_ingredients.list_position', 'asc')
  ]; 
  return Promise
    .all(queriesNeeded)
    .then(data => {
      if(data[0][0]) {
        return parse.databaseFullRecipeToClient(data)
      } else {
        return {status: 'No Such Recipe'};
      }
    });
};

// old version - very very stupid, but it works for sure
//module.exports.searchIngredientsByName = function(searchString) {
//  //look for ingredients that might be the target and return them
//  return knex.select('*')
//    .from('ingredients')
//    .where('name', 'ilike', '%'+searchString+'%');
//};

module.exports.searchIngredientsByName = function(searchString) {
  const strings = searchString.trim().split(' ').map(string => string ? '%' + string + '%' : '');
  let allSearch = knex.select('*')
    .from('ingredients')
    .where('name', 'ilike', strings[0]);
  for (let i = 1; i < strings.length; i++) {
    if (strings[i]) {
      allSearch = allSearch.andWhere('name', 'ilike', strings[i]);
    }
  }
  let anySearch = knex.select('*')
    .from('ingredients')
    .where('name', 'ilike', strings[0])
  for (let i = 1; i < strings.length; i++) {
    if (strings[i]) {
      anySearch = anySearch.orWhere('name', 'ilike', strings[i]);
    }
  }
  return Promise.all([allSearch, anySearch])
    .then( ([allSearch, anySearch]) => {
      anySearch = anySearch.filter(anyIng => {
        let isUniqueIngredient = true;
        allSearch.forEach(allIng => {
          if (anyIng.ndbno === allIng.ndbno) {
            isUniqueIngredient = false;
          }
        });
        return isUniqueIngredient;
      });
      return allSearch.concat(anySearch);
    })
};

module.exports.addIngredient = function(usdaIngredient) {
  //takes an ingredient object and stores it to the ingredients table
  //Assuming object is the usda return object's report.foods[0]
  let dbIngredient = parse.usdaIngredientToDatabase(usdaIngredient);
  return knex('ingredients')
    .insert(dbIngredient)
    .catch(err => {
      if(err.code === '23505') {
        //duplicate item, not actually a problem
        return;
      } else {
        throw err;
      }
    });
};

module.exports.addRecipeIngredient = function(recipeIngredient) {
  //takes an ingredient entry on a recipe and adds it to the recipe_ingredient junction table
  //might be useful for future recipe editing, not used as of right now
};

module.exports.addRecipe = function(clientRecipe) {
  //takes a recipe object, adds the basic data to the db, then adds recipe ingredients 
  let outerRecipeId = '';
  return knex.transaction(trx => {
    const dbRecipe = {
      name: clientRecipe.title,
      description: clientRecipe.description,
      userId: clientRecipe.userId,
      top_ingredients: clientRecipe.topIngredients,
      instructions: JSON.stringify(clientRecipe.instructions)
    };
    const dbIngredientJunction = clientRecipe.ingredients.map((ing, index) =>  {
      return {
        food_no: parseInt(ing.ndbno),
        quantity: parseFloat(ing.quantity),
        quantity_measure: 'g',
        list_position: index
      }
    })

    return trx
      .insert(dbRecipe)
      .into('recipes')
      .returning('id')
      .then(recipeId => {
        outerRecipeId = recipeId[0];
        //console.log('recipe ID: ', recipeId)
        dbIngredientJunction.forEach(entry => {
          entry.recipe_id = recipeId[0]
        })
        return trx
          .insert(dbIngredientJunction)
          .into('recipe_ingredients');
      })
      .then(() => outerRecipeId);
  })
};

module.exports.removeRecipe = function(recipe_id, cb) {
 // remove all join table Id references then remove recipe
  knex('recipe_ingredients')
    .where('recipe_id', recipe_id)
    .del()
  .then(() =>
    knex('recipes')
      .where('id', recipe_id)
      .del())
  .then(() => cb(null, 'delete successful'))
  .catch((err) => cb(err, null))
  //showing synax error but works fine..?
};

module.exports.addUser = (user, cb) => {
  knex('users').select()
  .where({gitName: user})
  .then(rows => {
    if (rows.length === 0) {
      return knex('users')
      .insert({gitName: user})
      .then(() => (
        knex('users').select('id')
        .where({gitName: user}))
      )
      .then(id => {
        cb(null, id)
      })
      .catch(err, null)
    } else {
      return knex('users').select('id')
      .where({gitName: user})
      .then((row) => {
        cb(null, row[0].id.toString())
      })
      .catch(err => {
        cb(err, null);
      })
    }
  })
  .catch(err => {
    return new Error(err);
  })
  
};
