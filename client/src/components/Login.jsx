import React from 'react';
import Auth0Lock from 'auth0-lock';
// import auth0_config from '../../../auth0_config.js';
const clientID = process.env.clientID;
const domain = process.env.domain;

let options = {
  languageDictionary: {
    title: 'Rocket Turtles'
  }
};

let lock = new Auth0Lock(clientID, domain, options);

lock.on("authenticated", function(authResult) {
  localStorage.setItem('accessToken', authResult.accessToken);
});

class Login extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      profile: {}
    }
    this.logout = this.logout.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
  }
  componentDidMount() {
    if (localStorage.accessToken) {
      this.getUserInfo();
    }
  }

  getUserInfo() {
    lock.getUserInfo(localStorage.accessToken, function(err, profile) {
      if (err) {
        console.error('GET USER INFO ERROR', err);
      }
      localStorage.setItem('profile', JSON.stringify(profile));
    });
  }

  logout() {
    localStorage.removeItem('accessToken');
    lock.logout({'returnTo':'http://localhost:3000'});
  }

  renderLoginButton() {
    if (localStorage.accessToken) {
      return (
        <button className='nav link' onClick={()=>this.logout()}>Logout</button>
      )
    } else {
      return (
        <button className='nav link' onClick={()=>lock.show()}>Login</button>
      )
    }
  }

  render() {
    return (
      <a>
        {this.renderLoginButton()}
      </a>
    )
  }
}

export default Login;