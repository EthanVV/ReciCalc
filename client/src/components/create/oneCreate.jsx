import React from 'react';
import { withRouter } from 'react-router-dom';
import Input from './createInput.jsx';
import axios from 'axios';
import { Chart, Axis, Series, Tooltip, Pie } from 'react-charts';

class Create extends React.Component {
  constructor(props){
    super(props);
    
    this.state = {
      title: '',
      description: '',

      userId: '',

      // handle change
      ing: '',  // current ing from onchange
      instr: '',  // curr instr from onchange

      // handle blur
      ingredients: [{ndbno:'', quantity:0, name:''}], // ingredient list ex: [{ndbno: '808', quantity: 2, name:'spam'}]
      instructions: [''],  // instruction list ex: ['mix', 'sautee']

      top_ingredients:'',  // string to go into db

      // dynamic rendering
      submit: false,  // whether total submit button was clicked

      // data from api
      nutrients: [],  
      totalCal: 0, 
      ndbno: [''],
      measure: [''],

      // chart data
      chartData: [[0, 1], [1, 2], [2, 4], [3, 2], [4, 7]]  // default data to show
    };
    
    // bind methods
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMore = this.handleMore.bind(this);
  }

  componentDidMount() {
    this.setUser();
  }

  setUser() {
    let profile = JSON.parse(localStorage.profile);
    axios.post('/api/users', {
      user: profile.nickname
    })
    .then(res => {
      this.setState({
        userId: parseInt(res.data)
      })

    })
  }

  handleChange(event){
    event.preventDefault();
    event.persist();
    
    // title, description, ing, instr
    let key = event.target.name;
    let value = event.target.value;
    this.setState((state, props) => {
      state[key] = value;
    })
  }

  handleData(data, cb){
    // can show only top 5

    // create data for chart
    const only = ['291', '205', '268', '203', '204'];  // use only major nutrients
    
    // for state
    let ndbno = [];
    let measure = [];

    const chartData = [];
    let totalCal = 0;

    const sum = {};
    for (let nut of data) {

      ndbno.push(nut.ndbno)
      measure.push(nut.weight)

      for (let obj of nut.nutrients) {
        if (only.includes(obj.nutrient_id)){
          let name = obj.nutrient;
          let num = isNaN(obj.value) ? 0 : parseFloat(obj.value); 

          if (sum[name]) {
            sum[name] += num;
          } else {
            sum[name] = num;
          }

          // total calories
        } else if (obj.nutrient_id === '208') {
          totalCal += parseFloat(obj.value)
        } 
      }
    }

    for (let key in sum) {
      chartData.push([key, sum[key]]);
    }
    
    this.setState({
      ndbno,
      measure,
      
      chartData,
      totalCal
    }, () => {

      // last item is always empty --> splice and add new unempty data
      this.setState((state, props) => {
        let n = {
          name: state.ing,
          quantity: state.measure[state.measure.length - 1],
          ndbno: state.ndbno[state.ndbno.length - 1]
        }

        state.ingredients.splice(state.ingredients.length - 1, 1, n)
     
      }, () => {
        cb()
      })

    })
  }

  handleClick(event){
    event.preventDefault();
    event.persist();

    this.setState({
      submit: true,
      top_ingredients: this.state.ingredients.reduce((prev, curr, i) => {
        if (i === 0) {
          return prev + curr.ndbno;
        } else {
          return [prev, curr.ndbno].join(', ');
        }
      }, '')

    }, () => {
      this.setState((state, props) => {
        state.ingredients.pop()
        state.instructions.pop()
      }, () => {
        const recipe = Object.assign({}, this.state);
        axios.post('api/recipes', {recipe})
        .then((res) => {
          this.props.history.push(`/recipes/${res.data.newRecipeId}`)
        })
        .catch((err) => {
          console.error('ERROR while post request for /api/recipes', err)
        })

      })



    })
  }

  // add more inputs
  handleMore(event){
    event.preventDefault();
    event.persist();
    
    if (event.target.name === 'ing') {
      // call api
      axios.post('/api/ingredients', {query: this.state.ing})
      .then((res) => {
        this.setState({
          nutrients: [...this.state.nutrients, res.data]
        }, () => {
          this.handleData(this.state.nutrients, () => {
            // add empty
            this.setState({
              ingredients: [...this.state.ingredients, {name:'', quantity: 0, ndbno:''}]
            })
          })
        })
      })
      .catch((err) => {
        console.log('ERROR receiving ingredient data', err)
      })

    }

    else if (event.target.name === 'instr') {
      // save current instr to instructions

      this.setState((state, props) => {
        // last item is always empty --> replace with new
        state.instructions.splice(state.instructions.length - 1, 1, state.instr)
     
      }, () => {
        // add empty
        this.setState({
          instructions: [...this.state.instructions, '']
        })

      })
      
    }

  }


  render(){
    // https://www.netrition.com/rdi_page.html
    let data = [
      {
        label: "g",
        data: this.state.chartData
      }

    ]

    return (
      <div id="createWrapper">
        <div id="nuthead" className="nutrients">
          <h2>What's cookin'?</h2>
        </div>
        
        <div className="nutrients" id="chartNut">
          <h3>Your Nutrients</h3>
          <div id="chart">
            <Chart data={data}>
              <Axis type="pie" />
              <Series type={Pie} showPoints={false} />
              <Tooltip />
            </Chart>
          </div>
          <h3>Total Calories</h3>
          <h5>{this.state.totalCal} kcal</h5>
        </div>
        
        <form className="nutrients" id="formNut">
          <label>
            <h3>Recipe title:</h3>
            <input type="text" name="title" placeholder="Add recipe title" onChange={this.handleChange}/>
          </label>

          <label>
            <h3>Recipe description:</h3>
            <textarea name="description" placeholder="Add recipe description" onChange={this.handleChange}/>
          </label>

          <label>
            <h3>Ingredients:</h3>
            {/* <Input handleChange={this.handleChange} handleMore={this.handleMore} name="ing" placeholder="Add ingredient" ingredient={true}/> */}
            {this.state.ingredients.map((val, i, coll) => {
 
              return (<Input 
              placeholder={"Add ingredient"}
              value={val.name}
              key={"item-" + i} 
              handleChange={this.handleChange}
              handleMore={this.handleMore}
              name={"ing"}
              ingredient={true}
              />)



            })}


          </label>

          <label>
            <h3>Instructions:</h3>
            {/* <Input handleChange={this.handleChange} handleMore={this.handleMore} name="instr" placeholder="Add instruction"/> */}
            {this.state.instructions.map((val, i, coll) => {
              
              return (
                <Input 
                key={"item-" + i} 
                handleChange={this.handleChange}
                value={val}
                handleMore={this.handleMore}
                name="instr"
                placeholder="Add instruction"
                />
                )

            })}
          </label>

          <input type="submit" value="Save Recipe" className="button" onClick={this.handleClick}/>
        
        </form>
      </div>
    );
  }

}

export default withRouter(Create);