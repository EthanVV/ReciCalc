import React, {Component} from 'react';
import RecipeListItem from './RecipeListItem.jsx';
import axios from 'axios';
class RecipeList extends Component {
    constructor(props){
        super(props);
        this.state = {
          allRecipes: [],
          userId: 0
        }
    }

  componentDidMount(){
    // make a get call to database @ api/recipes to retrieve all user recipes and setState
    // placeholder below
    // axios.get('api/recipes').then(response => {
    //   //console.log(response);
    //   this.setState({allRecipes: response.data.map(recipe => {
    //     return {
    //       id: recipe.id,
    //       name: recipe.name,
    //       description: recipe.description,
    //       top_ingredients: recipe.top_ingredients
    //     }
    //   })})
    // })
    // .catch(error => {
    //   console.log('error: ', error);
    // })
    this.setUser();
    // this.update();
  }

  setUser() {
    let profile = JSON.parse(localStorage.profile);
    axios.post('/api/users', {
      user: profile.nickname
    })
    .then(res => {
      this.setState({
        userId: parseInt(res.data)
      }, () => this.update())
    })
    // .then(() => {
    //   this.update();
    // })
  }

  update() {
    axios.get('api/recipes/', {
      params: {
        user: this.state.userId
      }
    })
    .then(response => {
      //console.log(response);
      this.setState({allRecipes: response.data.map(recipe => {
        return {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          top_ingredients: recipe.top_ingredients
        }
      })})
    })
    .catch(error => {
      console.log('error: ', error);
    })
  }

  deleteRecipe(recipe) {
    // let temp  = this.state.allRecipes[this.state.allRecipes.length - 1];
    console.log('delete last recipe clicked');
    console.log(recipe);

    axios.delete(`api/recipes/${recipe.id}`)
      .then(response => {
        console.log('delete response:',response);
      })
      .then(() => this.update())
      .catch(err => {
        console.log(err);
      })
  }

  render() {
    return (
      <div id='recipe-list'>
        <h3>Saved Recipes: </h3>
        <ul>
          {this.state.allRecipes.map(recipe => <RecipeListItem key={recipe.id} recipe={recipe} deleteRecipe={this.deleteRecipe.bind(this)}/>)}
        </ul>
      </div>
    )
  }
}

export default RecipeList;