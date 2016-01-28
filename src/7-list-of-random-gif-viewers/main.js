import React from 'react';
import { render } from 'react-dom';
import { connect, Provider } from 'react-redux';

import createElmishStore from '../elm/createElmishStore';
import forwardTo from '../elm/forwardTo';
import mapEffects from '../elm/mapEffects';
import generatorMap from '../elm/generatorMap';
import { View as RandomGif, update as randomGifUpdate } from '../5-random-gif-viewer/main';

// UPDATE

const INIT = 'INIT';
const CREATE = 'CREATE';
const TOPIC = 'TOPIC';
const SUBMSG = 'SUBMSG';

const initialAppState = {
  topic: '',
  gifList: [],
  uid: 0
};

const create = function*(model) {
  const { uid } = model;
  const randomGifModel = yield* mapEffects(randomGifUpdate(undefined, {type: INIT, payload: model.topic}), SUBMSG, uid);

  return {
    ...model,
    topic: '',
    gifList: [...model.gifList, {
      uid,
      model: randomGifModel
    }],
    uid: model.uid + 1
  };
};

const submsg = function*(model, payload) {
  const uid = payload.type;
  const action = payload.payload;

  return {
    ...model,
    gifList: yield* generatorMap(model.gifList, function*(gifModel) {
      if (gifModel.uid === uid) {
        return {
          ...gifModel,
          model: yield* mapEffects(randomGifUpdate(gifModel.model, action), SUBMSG, uid)
        };
      } else {
        return gifModel;
      }
    })
  };
};


export function* update(model = initialAppState, action) {
  const { type, payload } = action;

  switch (type) {
  case TOPIC:
    return {...model, topic: payload};

  case CREATE:
    return yield* create(model);

  case SUBMSG:
    return yield* submsg(model, payload);

  default:
    return model;
  }
}

// VIEW

const inputStyle = {
  width: '100%',
  height: '40px',
  padding: '10px 0',
  fontSize: '2em',
  textAlign: 'center'
};

export const View = ({dispatch, topic, gifList}) => (
  <div>
    <input
      placeholder="What kind of gifs do you want?"
      value={topic}
      onKeyDown={ev => ev.keyCode === 13 ? dispatch(CREATE) : null}
      onChange={ev => dispatch(TOPIC, ev.target.value)}
      style={inputStyle} />
    <div style={{display: 'flex', flexWrap: 'wrap'}}>
      {gifList.map(item => (
        <RandomGif
          key={item.id}
          dispatch={forwardTo(dispatch, SUBMSG, item.uid)}
          model={item.model} />
      ))}
    </div>
  </div>
);

// MAIN

const ConnectedView = connect(model => model)(View);
const store = createElmishStore(update);
const Application = () => <Provider store={store}><ConnectedView /></Provider>;

render(<Application />, document.getElementById('app'));
