import React, { Component } from 'react';
import Header from './components/layouts/Header';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

function getCookie(cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

class App extends Component {
  constructor(props) {
    super(props);
    this.autentica = this.autentica.bind(this);

    this.state = {
      user: {},
      autenticado: false,
      token: ''
    };
  }
  autentica = () => {
    fetch(
      `https://uce.intranet.bb.com.br/api-timeline/v1/autenticar/${getCookie(
        'BBSSOToken'
      )}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }
    )
      .then(response => {
        if (response.status > 350) {
          this.setState({ autenticado: false });
          window.location =
            'https://login.intranet.bb.com.br/distAuth/UI/Login?goto=https://uce.intranet.bb.com.br/timeline/';
        }

        if (response.headers.get('x-access-token') != null) {
          window.sessionStorage.token = response.headers.get('x-access-token');
          this.setState({ token: response.headers.get('x-access-token') });
        }

        return response.json();
      })
      .then(response => {
        this.setState({ user: response.user[0] });

        this.setState({ autenticado: true });
      })

      .catch(function(err) {
        this.setState({ token: '' });
        this.setState({ autenticado: false });
        window.location =
          'https://login.intranet.bb.com.br/distAuth/UI/Login?goto=https://uce.intranet.bb.com.br/timeline/';
        console.error(err);
      });
  };

  componentWillMount() {
    this.autentica();
  }
  render() {
    return (
      <Router initialEntries={['/timeline']} initialIndex={0}>
        <Route
          render={props =>
            this.state.autenticado ? (
              <Header
                {...props}
                user={this.state.user}
                token={this.state.token}
              />
            ) : (
              ''
            )
          }
        />
      </Router>
    );
  }
}

export default App;
