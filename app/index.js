import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Mouse from './components/Mouse';
import './app.global.css';

render(
  <AppContainer>
    <Mouse />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./components/Mouse', () => {
    const NextMouse = require('./components/Mouse'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextMouse />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
