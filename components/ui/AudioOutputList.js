import { AudioSession } from '@livekit/react-native';
import React from 'react';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const AudioOutputList = ({ onSelect }) => {
  const [audioOutputs, setAudioOutputs] = useState([]);
  useEffect(() => {
    let loadAudioOutputs = async () => {
      let outputs = await AudioSession.getAudioOutputs();
      setAudioOutputs(outputs);
    };
    loadAudioOutputs();
    return () => {};
  }, []);

  let selectOutput = async (deviceId) => {
    await AudioSession.selectAudioOutput(deviceId);
    onSelect();
  };
  let renderAudioOutput = ({ item }) => {
    return (
      <Pressable
        onPress={() => {
          selectOutput(item);
        }}
      >
        <View style={styles.spacer} />
        <Text style={styles.itemTextStyle}>{item}</Text>
        <View style={styles.spacer} />
      </Pressable>
    );
  };
  return (
    <View>
      <Text style={styles.titleTextStyle}>{'Select Audio Output'}</Text>
      <View style={styles.spacer} />
      <FlatList
        data={audioOutputs}
        renderItem={renderAudioOutput}
        keyExtractor={(item) => item}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginVertical: 8,
  },
  icon: {
    width: 32,
    height: 32,
  },
  spacer: {
    paddingTop: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'black',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  titleTextStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
  },
  itemTextStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
  },
});