import { addDoc, collection, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyDDnc9WHXf4CWwXCVggeiarYGu_xBgibJY',
	authDomain: 'eviusauth.firebaseapp.com',
	databaseURL: 'https://eviusauth.firebaseio.com',
	projectId: 'eviusauth',
	storageBucket: 'eviusauth.appspot.com',
	messagingSenderId: '400499146867',
	appId: '1:400499146867:web:5d0021573a43a1df',
};

// Initialize Firebase
export const FirebaseApp = initializeApp(firebaseConfig);
export const FirebaseDB = getFirestore(FirebaseApp);

export class CheckInServiceJs {
	eventId = '66d9babfff8148182c053214'; //Todo: Aquí coloca el id del evento
	experienceId = 'cyhH5yUGs5'; //toDo: Aquí coloca el id de la experiencia asignada
	participationCollection;
	attendeesCollection;
	experiences = [
		{
			id: 'i0own9qlUQ',
			name: 'EXPERIENCIA HUBBELL - HOLOGRAMA INTERACTIVO', //Carlos Guerra
		},
		{
			id: 'KbCLd9hZ3r',
			name: 'EXPERIENCIA BURNDY - RACO - WIEGMANN - JUEGO DE DESTREZA EN TÓTEM', //Alejandra
		},
		{
			id: 'cyhH5yUGs5',
			name: 'CHANCE LINEMAN TOOLS - MEMORY MATCH', //Carlos Guerra
		},
		{
			id: 'HI0qLLtutT',
			name: 'EXPERIENCIA KILLARK - TRIVIA EN TÓTEM', //Fabian Salcedo
		},
		{
			id: 'Fjkyw8lfUy',
			name: 'EXPERIENCIA BURNDY - REALIDAD VIRTUAL CON OCULUS',
		},
		{
			id: 'jZ8JxL0Vue',
			name: 'EXPERIENCIA WIRING - DETECCIÓN DE FALLAS VR',
		},
		{
			id: '45VD1hir8z',
			name: 'EXPERIENCIA RACO - JUEGO DE DESTREZA EN TÓTEM', //Fabian Salcedo
		},
	];

	constructor(firebaseDB) {
		this.firebaseDB = firebaseDB
		this.participationCollection = collection(firebaseDB, `event/${this.eventId}/usersActivityIntoExperiences`);
		this.attendeesCollection = collection(firebaseDB, `/${this.eventId}_event_attendees`);
	}

	async getUserParticipation({ userCode }) {
		const q = query(this.participationCollection, where('userCode', '==', userCode), where('experienceId', '==', this.experienceId));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const participation = {
				id: querySnapshot.docs[0].id,
				...querySnapshot.docs[0].data(),
			};
			return participation;
		} else {
			return null;
		}
	}

	async saveUserParticipation({ userCode, points, newParticipation = false }) {
		const attendee = await this.getAttendeeByUserCode({ userCode });
		const now = new Date();
		console.log(points);
		

		const checkInAt = Timestamp.fromDate(now);
		const updateAt = Timestamp.fromDate(now);

		if (attendee === null) throw Error('404');

		const previousParticipation = await this.getUserParticipation({ userCode });


		if (previousParticipation) {
			const docId = previousParticipation.id;
			const userExperienceRef = doc(this.firebaseDB, `event/${this.eventId}/usersActivityIntoExperiences`, docId);

			const newPoints = points === undefined ? previousParticipation.points : points;
			
			

			const newParticipationDateList = [...previousParticipation.participationDateList];
			if (newParticipation) {
				newParticipationDateList.push(checkInAt);
			}
			
			await updateDoc(userExperienceRef, { points: newPoints, updateAt, participationDateList: newParticipationDateList });

			return docId;
		} else {
			const experience = this.getExperienceById({ experienceId: this.experienceId });
			const attendee = await this.getAttendeeByUserCode({ userCode });

			if (!attendee) return console.error('El código no está registrado');

			const newDoc = {
				participationDateList: [checkInAt],
				userCode,
				checkInAt,
				experienceId: this.experienceId,
				experienceName: experience.name,
				points: points === undefined ? 0 : points,
				email: attendee.properties.email,
				names: attendee.properties.names,
				updateAt,
			};
			const newDocRef = await addDoc(this.participationCollection, newDoc);
			return newDocRef.id;
		}
	}

	async getAttendeeByUserCode({ userCode }) {
		const q = query(this.attendeesCollection, where('user_code', '==', userCode));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			if (querySnapshot.docs.length > 1) throw new Error('Código asignado a dos usuarios');

			const docId = querySnapshot.docs[0].id;
			const data = querySnapshot.docs[0].data();
			const attendee = {
				id: docId,
				...data,
			};
			return attendee;
		}
		return null;
	}

	getExperienceById({ experienceId }) {
		const experience = this.experiences.find((experience) => experience.id === experienceId);
		return experience;
	}
}

export const checkInServiceJs = new CheckInServiceJs(FirebaseDB);
