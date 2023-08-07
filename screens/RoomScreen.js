import * as React from 'react';

import {
  StyleSheet,
  View,
  FlatList,
  findNodeHandle,
  NativeModules,
} from 'react-native';
import { useEffect, useState } from 'react';
import { RoomControls } from '../components/RoomControls';
import { ParticipantView } from '../components/ParticipantView';
import {
  DataPacket_Kind,
  Room,
  RoomEvent,
} from 'livekit-client';
import { useRoom, useParticipant, AudioSession } from '@livekit/react-native';
import { Platform } from 'react-native';

import {
  mediaDevices,
  ScreenCapturePickerView,
} from '@livekit/react-native-webrtc';
import { startCallService, stopCallService } from '../components/callservice/CallService';
import Toast from 'react-native-toast-message';

import 'fastestsmallesttextencoderdecoder';

export default RoomScreen = ({
  navigation,
  route,
}) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () =>
      new Room({
        adaptiveStream: { pixelDensity: 'screen' },
      })
  );
  const { participants } = useRoom(room);
  const { url, token } = route.params;
  const [isCameraFrontFacing, setCameraFrontFacing] = useState(true);

  // Perform platform specific call setup.
  useEffect(() => {
    startCallService();
    return () => {
      stopCallService();
    };
  }, [url, token, room]);

  // Connect to room.
  useEffect(() => {
    let connect = async () => {
      // If you wish to configure audio, uncomment the following:
      // await AudioSession.configureAudio({
      //   android: {
      //     preferredOutputList: ["earpiece"],
      //     audioMode: 'normal',
      //     audioFocusMode: 'gain',
      //   },
      //   ios: {
      //     defaultOutput: "earpiece"
      //   }
      // });
      await AudioSession.startAudioSession();
      // console.log(participants);
      await room.connect(url, token, {});
      console.log('connected to ', url, ' ', token);
      setIsConnected(true);
    };
    
    connect();
    return () => {
      room.disconnect();
      AudioSession.stopAudioSession();
    };
  }, [url, token, room]);

  
  // Setup room listeners
  useEffect(() => {
    const dataReceived = (
      payload,
      participant
      ) => {
        let decoder = new TextDecoder('utf-8');
        let message = decoder.decode(payload);
        
        let title = 'Received Message';
        if (participant != null) {
          title = 'Received Message from ' + participant.identity;
        }
      Toast.show({
        type: 'success',
        text1: title,
        text2: message,
      });
    };
    room.on(RoomEvent.DataReceived, dataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, dataReceived);
    };
  });

  // Setup views.
  const stageView = participants.length > 0 && (
    <ParticipantView participant={participants[0]} style={styles.stage} />
  );

  const renderParticipant = ({ item }) => {
    return (
      <ParticipantView participant={item} style={styles.otherParticipantView} />
    );
  };

  const otherParticipantsView = participants.length > 0 && (
    <FlatList
      data={participants}
      renderItem={renderParticipant}
      keyExtractor={(item) => item.sid}
      horizontal={true}
      style={styles.otherParticipantsList}
    />
  );

  const { cameraPublication, microphonePublication, screenSharePublication } =
    useParticipant(room.localParticipant);
  

  // Prepare for iOS screenshare.
  const screenCaptureRef = React.useRef(null);
  const screenCapturePickerView = Platform.OS === 'ios' && (
    <ScreenCapturePickerView ref={screenCaptureRef} />
  );
  const startBroadcast = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      room.localParticipant.setScreenShareEnabled(true);
    } else {
      room.localParticipant.setScreenShareEnabled(true);
    }
  };

  return (
    <View style={styles.container}>
      {stageView}
      {otherParticipantsView}
      <RoomControls
        micEnabled={isTrackEnabled(microphonePublication)}
        setMicEnabled={(enabled) => {
          room.localParticipant.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={isTrackEnabled(cameraPublication)}
        setCameraEnabled={(enabled) => {
          room.localParticipant.setCameraEnabled(enabled);
        }}
        switchCamera={async () => {
          let facingModeStr = !isCameraFrontFacing ? 'front' : 'environment';
          setCameraFrontFacing(!isCameraFrontFacing);

          let devices = await mediaDevices.enumerateDevices();
          console.log(devices)
          var newDevice;
          
          for (const device of devices) {
            
            if (
              device.kind === 'videoinput' &&
              device.facing === facingModeStr
            ) {
              newDevice = device;
              break;
            }
          }

          if (newDevice == null) {
            return;
          }

          await room.switchActiveDevice('videoinput', newDevice.deviceId);
        }}
        screenShareEnabled={isTrackEnabled(screenSharePublication)}
        setScreenShareEnabled={(enabled) => {
          if (enabled) {
            startBroadcast();
          } else {
            room.localParticipant.setScreenShareEnabled(enabled);
          }
        }}
        sendData={(message) => {
          Toast.show({
            type: 'success',
            text1: 'Sending Message',
            text2: message,
          });

          let encoder = new TextEncoder();
          let encodedData = encoder.encode(message);
          room.localParticipant.publishData(
            encodedData,
            DataPacket_Kind.RELIABLE
          );
        }}
        onSimulate={(scenario) => {
          room.simulateScenario(scenario);
        }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
      {screenCapturePickerView}
    </View>
  );
};

function isTrackEnabled(pub) {
  return !(pub?.isMuted ?? true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
  },
  otherParticipantsList: {
    width: '100%',
    height: 150,
    flexGrow: 0,
  },
  otherParticipantView: {
    width: 150,
    height: 150,
  },
});