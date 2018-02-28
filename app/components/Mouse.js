// @flow
import React, { Component } from 'react';
import styles from './Mouse.css';

const { ipcRenderer } = require('electron');

const names = {
  0: 'MouseSpeed',
  1: 'MouseThreshold1',
  2: 'MouseThreshold2',
  3: 'MouseSensitivity',
};

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.defaultValues = {
      MouseSpeed: 2,
      MouseThreshold1: 2,
      MouseThreshold2: 5,
      MouseSensitivity: 10,
    };
    this.state = {
      inputs: this.defaultValues,
      validationErrors: {},
      userMessage: '',
      fadeIn: false,
    };
  }
  componentWillMount = () => {
    ipcRenderer.on('setRegistryValues-Result', this.handleSetResults);
    ipcRenderer.on('setRegistryValues-Error', this.handleErrors);
    ipcRenderer.on('getRegistryValues-Result', this.handleGetResults);
    ipcRenderer.on('getRegistryValues-Error', this.handleErrors);
  }
  componentDidMount = () => {
    ipcRenderer.send('getRegistryValues');
  }
  componentWillUnmount = () => {
    ipcRenderer.removeListener('setRegistryValues-Result', this.handleSetResults);
    ipcRenderer.removeListener('setRegistryValues-Error', this.handleErrors);
    ipcRenderer.removeListener('getRegistryValues-Error', this.handleErrors);
  }
  sendMessage = (message) => {
    clearTimeout(this.firstTimeout);
    clearTimeout(this.secondTimeout);
    this.setState({ userMessage: message, fadeIn: true, }, () => {
      this.firstTimeout = setTimeout(() => {
        this.setState({ fadeIn: false }, () => {
          this.secondTimeout = setTimeout(() => {
            this.setState({ userMessage: '' });
          }, 2000);
        });
      }, 2000);
    });
  }
  handleSetResults = (event, arg) => {
    this.sendMessage(arg);
  }
  handleGetResults = (event, arg) => {
    this.defaultValues = arg;
    this.setState({ inputs: this.defaultValues });
  }
  handleErrors = (event, arg) => {
    console.error(arg);
  }
  handleSet = () => {
    const { validationErrors } = this.state;
    const errors = Object.keys(validationErrors);
    if (errors.length) {
      this.sendMessage('You must fix validation issues first.');
    } else {
      ipcRenderer.send('setRegistryValues', { ...this.state.inputs });
    }
  }
  handleReset = () => {
    this.setState({
      inputs: this.defaultValues,
      validationErrors: {},
    });
    ipcRenderer.send('setRegistryValues', { ...this.defaultValues });
  }
  validateInputs = (inputName, value) => {
    const intValue = value.length ? parseInt(value, 10) : -1;
    const { validationErrors } = this.state;
    if (inputName === names[0]) {
      if (intValue < 0 || intValue > 2) {
        this.setState({
          validationErrors: {
            ...validationErrors,
            [inputName]: 'Value must be betwen 0 and 2.'
          }
        });
      } else {
        const newErrors = { ...validationErrors };
        delete newErrors[inputName];
        this.setState({
          validationErrors: newErrors,
        });
      }
    } else if (intValue < 0 || intValue > 20) {
      this.setState({
        validationErrors: {
          ...validationErrors,
          [inputName]: 'Value must be betwen 0 and 20.'
        }
      });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[inputName];
      this.setState({
        validationErrors: newErrors,
      });
    }
  }
  updateInput = (inputName) => (event) => {
    this.validateInputs(inputName, event.target.value);
    this.setState({
      inputs: {
        ...this.state.inputs,
        [inputName]: event.target.value,
      }
    });
  }
  render() {
    const { inputs, validationErrors } = this.state;

    return (
      <div>
        <div className={styles.container} data-tid="container">
          <div className={styles.header}>
            <h2>Mouse 2.0</h2>
          </div>
          <div className={styles.inputBox}>
            <label htmlFor={names[0]}>{names[0]}</label>
            <input
              className={validationErrors[names[0]] && styles.inputError}
              name={names[0]}
              type="number"
              value={inputs[names[0]]}
              min="0"
              max="2"
              onChange={this.updateInput(names[0])}
            />
            <span className={styles.errorMsg}>
              {validationErrors[names[0]]}
            </span>
            <label htmlFor={names[1]}>{names[1]}</label>
            <input
              className={validationErrors[names[1]] && styles.inputError}
              name={names[1]}
              type="number"
              value={inputs[names[1]]}
              min="0"
              max="20"
              onChange={this.updateInput(names[1])}
            />
            <span className={styles.errorMsg}>
              {validationErrors[names[1]]}
            </span>
            <label htmlFor={names[2]}>{names[2]}</label>
            <input
              className={validationErrors[names[2]] && styles.inputError}
              name={names[2]}
              type="number"
              value={inputs[names[2]]}
              min="0"
              max="20"
              onChange={this.updateInput(names[2])}
            />
            <span className={styles.errorMsg}>
              {validationErrors[names[2]]}
            </span>
            <label htmlFor={names[3]}>{names[3]}</label>
            <input
              className={validationErrors[names[3]] && styles.inputError}
              name={names[3]}
              type="number"
              value={inputs[names[3]]}
              min="0"
              max="20"
              onChange={this.updateInput(names[3])}
            />
            <span className={styles.errorMsg}>
              {validationErrors[names[3]]}
            </span>
          </div>
          <div className={styles.footer}>
            <div className={styles.buttonBox}>
              <button onClick={this.handleSet}>Set</button>
              <button onClick={this.handleReset}>Reset</button>
            </div>
            <span className={styles.footnote}>&copy;2017 p3ss</span>
            <div
              className={[styles.snackbar, this.state.fadeIn ? styles.visible : styles.hidden].join(' ')}
            >
              {this.state.userMessage}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
