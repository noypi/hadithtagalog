import React from 'react';
import {Provider} from 'react-native-paper';

import "./init";
import {HomeScreen} from '@screens';


export default function App() {
    const theme = useAppTheme();
    //console.debug({colorsPrimary:theme.colors.primary});
    return (
      <Provider theme={theme}>
          <HomeScreen />
      </Provider>
    );
  }
