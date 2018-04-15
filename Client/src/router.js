import React from 'react'
import { Router, Route, Switch } from 'dva/router'
import StarterPage from './routes/StarterPage'
import MainPage from './routes/MainPage'

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/" exact component={StarterPage} />
        <Route path="/restore" component={MainPage} />
        <Route path="/main" exact component={MainPage} />
        <Route path="/:major/:classYear" exact component={MainPage} />
      </Switch>
    </Router>
  )
}

export default RouterConfig
