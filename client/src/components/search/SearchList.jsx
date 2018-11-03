import React from 'react';

const SearchList = ({ingredients, deleteIngredient}) => (
  <ul className='search-list'>
    {ingredients.map((ingredient, i) => (
      <ul>
        <div className ='ingredient-in-search'>
          className='search-list-entry'
        >• {ingredient}
        <input 
          className='button remove-btn'
          type='submit' 
          value='X'
          name={i}
          onClick={(e) => deleteIngredient(e)}/>
          </div>
      </ul>
    ))}
  </ul>
)

export default SearchList;