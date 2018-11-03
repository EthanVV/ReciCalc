require('dotenv').config()
const db = require('../..//database/db.js');
const format = require('../../helpers/formatCheckers.js');

module.exports.recipes = {
  getList: (req, res) => {
    let userId = req.query.user;
    //query database for a list of short recipe descriptions and return them
    db.fetchRecipeList(userId)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(err => {
        console.log('ERROR FETCHING RECIPE LIST FROM DB: ', err);
        res.status(500).send()
      });
  },
  getOne: (req, res) => {
    //endpoint: /api/recipes/:recipeId
    //query database for detailed information on the given recipe and return it
    let recipeId = parseInt(req.params.recipeId);
    if(isNaN(recipeId)) {
      res.status(400).send('Malformed recipe ID');
    } else {
      db.fetchRecipeById(recipeId)
        .then(recipe => {
          if(recipe.status === 'No Such Recipe') {
            res.status(404).send(recipe);
          }
          else {
            res.status(200).json(recipe);
          }
        })
        .catch(err => {
          console.log('ERROR FETCHING FULL RECIPE FROM DB:', err)
          res.status(500).send(err);
        })
    }
  },
  post: (req, res) => {
    //Store recipe in database
    let recipe = req.body.recipe;
    console.log('Incoming recipe request:', recipe);

    if(format.isValidRecipe(recipe) === false) {
      res.status(400).send('Malformed recipe');
    } else {
      db.addRecipe(recipe)
        .then(data => {
          console.log('saved recipe to db')
          res.status(201).json({newRecipeId: data});
        })
        .catch(err => {
          if (err.detail === 'A field with precision 8, scale 2 must round to an absolute value less than 10^6.') {
            res.status(400).send('Ingredient quantity too large: maximum value 999,999.99');
          } else {
            console.log('ERROR STORING RECIPE TO DATABASE:', err);
            res.status(500).send();
          }
        })
    }
  },
  delete: (req, res) => {
    let recipeId = parseInt(req.params.recipeId);
    // delete recipe in database
    console.log('recipe delete route hit');

    db.removeRecipe(recipeId, (err, data) => {
      if (err) {
        console.log('err durring recipe delete', err);
        res.status(400).send('err durring recipe delete');
      } else {
        console.log('recipe delted', data);
        res.status(200).send('receipe deleted');
      }
    });
  }
};