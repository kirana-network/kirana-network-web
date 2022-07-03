import "reflect-metadata";

import ReactDOM from 'react-dom';
import firebase from "firebase";
import { I18n } from "react-polyglot";

import { loadMessages } from './core/i18n/utils';
import { register as registerDI } from "./core/getIt";
import { CssBaseline } from '@mui/material';
import AppContainer from './AppContainer';

// Initialize Firebase
var firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};
firebase.initializeApp(firebaseConfig);

document.title = process.env.REACT_APP_APP_TITLE || "";

// Initialize i18n
const locale = navigator.language.split("-")[0] || "en";
const messages = loadMessages(locale);

// registerDI
registerDI();

ReactDOM.render(
    <>
        {/* <ThemeProvider theme={theme}> */}
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <I18n locale={locale} messages={messages}>
            <AppContainer />
        </I18n>
        {/* </ThemeProvider> */}
    </>,
    document.querySelector('#root'),
);
