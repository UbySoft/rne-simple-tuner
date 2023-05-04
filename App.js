import React, {useState, useEffect} from "react";
import {View, Text, StyleSheet} from "react-native";
import {Audio} from "expo-av";
import {MaterialCommunityIcons as Icon} from "@expo/vector-icons";
import Dsp from "./components/dsp";
import * as FileSystem from "expo-file-system";
import base64 from "base-64";
import {AudioUtils} from "react-native-audio-toolkit";
import axios from "axios";

const GuitarTuner = () => {
	const [isRecording, setIsRecording] = useState(false);
	const [currentFrequency, setCurrentFrequency] = useState(0);
	const [recordingInstance, setRecordingInstance] = useState(null);

	useEffect(() => {
		// Richiedere i permessi necessari
		(async () => {
			const {status} = await Audio.requestPermissionsAsync();
			if (status !== "granted") {
				alert("I permessi per l'accesso al microfono sono richiesti per utilizzare questa app.");
			}

			// Configurare il modo audio per iOS
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
			});
		})();
	}, []);

	const analyzeAudio = async (fileURI) => {
		try {
			const audioData = await FileSystem.readAsStringAsync(fileURI, {
				encoding: FileSystem.EncodingType.Base64,
			});

			const formData = new FormData();
			formData.append("audio", {
				uri: fileURI,
				name: "audio.wav",
				type: "audio/wav",
			});

			const response = await axios.post("http://192.168.0.140:3000/analyze", formData, {
				headers: {"Content-Type": "multipart/form-data"},
			});

			const {frequency, note} = response.data;
			console.log("Frequency:", frequency, "Note:", note);
		} catch (error) {
			console.error("Error analyzing audio:", error);
		}
	};

	const startRecording = async () => {
		// console.log('startRecording');
		try {
			const recording = new Audio.Recording();
			await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);

			await recording.startAsync();
			setRecordingInstance(recording);
			setIsRecording(true);
		} catch (error) {
			console.error("Impossibile avviare la registrazione:", error);
		}
	};

	const stopRecording = async () => {
		//console.log('stopRecording');
		try {
			await recordingInstance.stopAndUnloadAsync();
			setIsRecording(false);

			const fileURI = recordingInstance.getURI();
			//console.log('fileURI: ', fileURI);
			analyzeAudio(fileURI);
		} catch (error) {
			console.error("Impossibile fermare la registrazione:", error);
		}
	};

	const toggleRecording = () => {
		//  console.log('toggleRecording');
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	return (
		<View style={styles.container}>
			<Icon
				name={isRecording ? "microphone" : "microphone-off"}
				size={50}
				onPress={toggleRecording}
			/>
			<Text>Frequenza attuale: {currentFrequency.toFixed(2)} Hz</Text>
		</View>
	);
};

export default function App() {
	return (
		<View style={styles.container}>
			<GuitarTuner />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
