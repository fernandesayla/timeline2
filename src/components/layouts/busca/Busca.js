import React from 'react';
import PropTypes from 'prop-types';
import deburr from 'lodash/deburr';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import { InputBase } from '@material-ui/core';

const suggestions = [];
const WAIT_INTERVAL = 1000;

function renderInputComponent(inputProps) {
  const { classes, inputRef = () => {}, ref, ...other } = inputProps;

  return (
    <InputBase
      fullWidth
      className={classes.input}
      InputProps={{
        inputRef: node => {
          ref(node);
          inputRef(node);
        }
      }}
      {...other}
    />
  );
}

function renderSuggestion(suggestion, { query, isHighlighted }) {
  const matches = match(suggestion.nome, query);
  const parts = parse(suggestion.nome, matches);

  return (
    <MenuItem selected={isHighlighted} component="div">
      <div>
        {parts.map((part, index) => {
          return part.highlight ? (
            <span key={String(index)} style={{ fontWeight: 500 }}>
              {part.text}
            </span>
          ) : (
            <strong key={String(index)} style={{ fontWeight: 300 }}>
              {part.text}
            </strong>
          );
        })}
      </div>
    </MenuItem>
  );
}

function getSuggestions(value) {
  const inputValue = deburr(value.trim()).toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? []
    : suggestions.filter(suggestion => {
        const keep =
          count < 5 &&
          suggestion.nome.slice(0, inputLength).toLowerCase() === inputValue;

        if (keep) {
          count += 1;
        }

        return keep;
      });
}

function getSuggestionValue(suggestion) {
  return '';
}

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  container: {
    position: 'relative'
  },
  suggestionsContainerOpen: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0
  },
  suggestion: {
    display: 'block'
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none'
  },
  divider: {
    height: theme.spacing.unit * 2
  },
  input: {
    fontSize: 26,
    color: theme.palette.common.white
  }
});

class Busca extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      popper: '',
      suggestions: []
    };

    this.triggerChange = this.triggerChange.bind(this);
  }

  componentWillMount() {
    this.timer = null;
  }

  handleSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: getSuggestions(value)
    });
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  search = event => {
    clearTimeout(this.timer);
    this.setState({ value: event.target.value });
    this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
  };

  triggerChange() {
    const { value } = this.state;

    const url = new URL(this.props.url + value.replace(/\s/g, ''));
    //Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url, {
      headers: {
        'x-access-token': window.sessionStorage.token,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        this.setState({ suggestions: data.users[0] });
      })
      .catch(function(err) {
        console.error(err);
      });
  }

  handleChange = name => (event, { newValue }) => {
    this.setState({
      [name]: newValue
    });
  };
  handleSuggestionSelected = (
    event,
    { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }
  ) => {
    this.props.addSuggestion(suggestion);
  };

  render() {
    const { classes } = this.props;

    const autosuggestProps = {
      renderInputComponent,
      suggestions: this.state.suggestions,
      onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested,
      onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
      onSuggestionSelected: this.handleSuggestionSelected,
      getSuggestionValue,
      renderSuggestion
    };

    return (
      <div className={classes.root}>
        <Autosuggest
          {...autosuggestProps}
          inputProps={{
            classes,
            placeholder: 'Search company by name',
            value: this.state.value,
            onKeyUp: this.search,
            onChange: this.handleChange('value')
          }}
          theme={{
            container: classes.container,
            suggestionsContainerOpen: classes.suggestionsContainerOpen,
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion
          }}
          renderSuggestionsContainer={options => (
            <Paper {...options.containerProps} square>
              {options.children}
            </Paper>
          )}
        />
      </div>
    );
  }
}

Busca.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Busca);
