import * as React from 'react';
import {Text as RNText, View} from 'react-native';
import { Paragraph, Surface } from 'react-native-paper';
import { findAll } from 'highlight-words-core';

export function HighlightText({
    autoEscape,
    caseSensitive,
    sanitize,
    searchWords,
    textToHighlight,
    highlightComponent,
    textComponent,
    ...props
  }) {
    const chunks = findAll({
      autoEscape,
      caseSensitive,
      sanitize,
      searchWords,
      textToHighlight,
    });
    const Text = textComponent || RNText;
    const Highlight = highlightComponent || RNText;
  
    return (
      <>
        {chunks.map((chunk, index) => {
          const text = textToHighlight.substr(
            chunk.start,
            chunk.end - chunk.start
          );
  
          return chunk.highlight ? (
            <Highlight key={`chunk-${index}`}>
              {text}
            </Highlight>
          ) : (
            <Text key={`chunk-${index}`}>{text}</Text>
          );
        })}
      </>
    );
  }