import * as React from 'react';
import { Button, Dialog, Portal, Text, Surface } from 'react-native-paper';

export const PopupDialog = ({visible, title, actionText, onDismiss, onAction, contentComponent}) => {
  const Content = contentComponent;
  return (
    <Portal>
        <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
            {Content}
        </Dialog.Content>
        <Dialog.Actions>
            <Button onPress={onAction}>{actionText}</Button>
        </Dialog.Actions>
        </Dialog>
    </Portal>
  );
};