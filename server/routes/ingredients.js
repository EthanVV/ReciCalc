require('dotenv').config()
const API_KEY = process.env.API_KEY;
const db = require('../../database/db.js');
const axios = require('axios');
const qs = require('qs');
const format = require('../../helpers/formatCheckers.js');

module.exports.ingredients = {
  getDbByName: (req, res) => {
    //expect req.query to have 'searchTerm'
    //Query database for ingredients matching a particular search string, and present them
    if(req.query.searchTerm === undefined) {
      res.status(400).send('Malformed search request');
    } else {
      db.searchIngredientsByName(req.query.searchTerm)
        .then(ingredients => {
          res.status(200).json(ingredients);
        })
        .catch(err => {
          console.log('ERROR SEARCHING FOR INGREDIENT: ', err);
          res.status(500).send();
        })
    }
  },
  getUsdaByName: (req, res) => {
    //Query USDA NDB API for ingredients matching a particular search string, and present them

    //expect req.params to have 'searchTerm'
    //also expect it may have 'page'
    //console.log('looking for USDA ingredients by name: ' + req.query.searchTerm)
    let offset = req.query.page ? req.query.page * 8 : 0;

    axios.get(`https://api.nal.usda.gov/ndb/search/?`, {
      params: {
        format: 'JSON',
        q: req.query.searchTerm,
        sort: 'r',
        max: 8,
        offset: offset,
        ds: 'Standard Reference',
        api_key: `${API_KEY}`
      },
    })
      .then((data) => {
        if(data.data.list) {
          res.status(200).send(data.data.list.item);
        } else {
          res.status(200).send([]);
        }
      })
      .catch(error => {
        console.log('Error searching USDA database: ', error)
        res.status(500).send();
      });
  },
  getUsdaIngredientInfo: (req, res) => {
    //expect req.params.ndbno 
    //Query USDA API for nutritional data about the provided item number
    if (format.isValidNdbno(req.params.ndbno) === false) {
      res.status(400).send('Malformed NDB number');
    }
    //console.log('looking for nutrients by NDB no: ', req.params.ndbno);
    axios.get('https://api.nal.usda.gov/ndb/nutrients/?', {
      params: {
        format: 'JSON',
        api_key: `${API_KEY}`,
        nutrients: ['208', '204', '606', '291', '203', '307', '601', '269', '205'],
        ndbno: req.params.ndbno
      },
      paramsSerializer: function(params) {
        return qs.stringify(params, {indices: false})
      },
    })
      .then(data => {
        if(data.data.errors) {
          res.status(500).send(data.data.errors.error);
        } else {
          db.addIngredient(data.data.report.foods[0])
            .then(() => res.status(200).send(data.data.report.foods[0]))
            .catch((err) => {
              console.log('ERROR: ', err);
              res.status(500).send('Data fetched, but not stored to database. Try again.')
            })
          
        }
      })
      .catch(error => {
        console.log('ERROR IN INGREDIENT FIND: ', error);
        res.status(500).send();
      });
  },
  post: (req, res) => {
    //Store ingredient in database
    //planned functionality moved elsewhere...
    res.status(404).send();
  }
}

//EXAMPLE DATABASE INTERACTION:
//
//confirmAccess = function(req, res) => {
//  db.checkAccess(req.params.number)
//    .then(data => {
//      //do some calculations with the data and make formattedData
//      res.status(200).json(formattedData);
//    })
//    .catch(err => res.status(500).send(err));
//}