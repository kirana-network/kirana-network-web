import React, { useState, useEffect } from "react";
import firebase from 'firebase';
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import { Paper, Box, Button, Divider, Stack, TextField, Typography, Link } from "@mui/material";
import { useTranslate } from "react-polyglot";
import 'reflect-metadata';

// import "./LoginPage.css";
import { useSnackbar } from "notistack";
import { getLoggingInstance } from "../core/utils/logger";
import { basename } from "path";
import { initializeFirebaseApp } from "../core/utils/auth";
import { useRouter } from "next/router";

const logger = getLoggingInstance(basename(__filename));

export default function LoginPage() {
    const t = useTranslate();
    const [showEmailLogin, setShowEmailLogin] = useState(true);
    const [showRegisterAccount, setShowRegisterAccount] = useState<any>();
    const [showForgotPassword, setShowForgotPassword] = useState<any>();
    const socialConfig = getConfig([
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ]);
    const displayInline = { display: "inline", marginRight: "5px", fontSize: "inherit" };

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
        initializeFirebaseApp();
    }, [])

    if (loading) {
        return <></>
    }

    if (typeof window == 'undefined') {
        return <></>
    }

    return (
        <Box display="flex">
            <Box width="300px" mx="auto" marginTop={10}>
                <Stack spacing={3}>
                    <Typography variant="h5" textAlign="center">{t("app.login.log_in")}</Typography>
                    <StyledFirebaseAuth firebaseAuth={firebase.auth()} uiConfig={socialConfig as any} />
                    <Divider>{t("app.login.or")}</Divider>

                    {
                        showEmailLogin &&
                        <EmailLoginFragment
                            onRegisterRequired={(data: any) => {
                                setShowEmailLogin(false);
                                setShowRegisterAccount(data);
                            }}
                        />
                    }

                    {
                        showRegisterAccount &&
                        <RegisterAccountFragment {...showRegisterAccount} />
                    }

                    {
                        showForgotPassword &&
                        <ForgotPasswordFragment {...showForgotPassword} />
                    }

                    <Stack spacing={0} direction="row" sx={{ display: "block" }}>
                        <Button onClick={() => { setShowEmailLogin(false); setShowForgotPassword({}); setShowRegisterAccount(null) }}>{t("app.login.forgot_password")}</Button>
                        <Button sx={{ float: "right" }} onClick={() => { setShowEmailLogin(false); setShowForgotPassword(null); setShowRegisterAccount({}); }}>{t("app.login.join_now")}</Button>
                    </Stack>
                    <Box color="GrayText" fontSize={"small"}>
                        <Typography sx={displayInline}>{t("app.login.agree_to_terms_privacy")}</Typography>
                        <Link sx={displayInline} href="https://fleetonroute.com/terms-and-conditions">{t("app.login.terms_and_conditions")}</Link>
                        <Typography sx={displayInline}>{t("app.login.and")}</Typography>
                        <Link sx={displayInline} href="https://fleetonroute.com/privacy-policy">{t("app.login.privacy_policy")}.</Link>
                    </Box>
                </Stack>
            </Box>
        </Box >
    )
}

function getConfig(providers: string[]) {
    return {
        signInFlow: 'popup',
        signInOptions: providers,
        credentialHelper: "none",
        callbacks: {
            // signInSuccessWithAuthResult: (authResult: any) => alert("Logged In")
        },
    };
}

function EmailLoginFragment(props: any) {
    const t = useTranslate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showAlternateSignInMethod, setShowAlternateSignInMethod] = useState<any>();
    const [showPasswordField, setShowPasswordField] = useState(false);
    const [error, setError] = useState("");
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();

    if (showAlternateSignInMethod) {
        return (
            <Box>
                <Stack spacing={2}>
                    <Typography variant="h5">{t("app.login.already_have_account", { email })}</Typography>
                    <Typography>{t("app.login.sign_in_with_social", { provider: showAlternateSignInMethod.provider })}</Typography>
                </Stack>
            </Box>
        )
    }

    const getProvider = () => {
        firebase
            .auth()
            .fetchSignInMethodsForEmail(email)
            .then(results => {
                logger.trace("fetchSignInMethodsForEmail", { results })
                if (results.includes("google.com")) {
                    setShowAlternateSignInMethod(true);
                }
                else if (results.includes("password")) {
                    // do stuff
                    setShowPasswordField(true);
                }
                else if (results.length == 0) {
                    props.onRegisterRequired({ email });
                }
            })
            .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })));
    }

    const doLogin = () => {
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then(credentials => {
                logger.trace("credentials", { credentials });
                router.replace("/")
            })
            .catch(error => setError(error.message || typeof error));
    }

    return (
        <Stack spacing={1}>
            <TextField
                onChange={evt => setEmail(evt.currentTarget.value)}
                label={t("app.login.email_address")}
                variant="outlined"
                onKeyPress={(e) => {
                    if (e.key == "Enter") {
                        if (!showPasswordField) {
                            getProvider();
                        }
                    }
                }}
            />

            {
                showPasswordField &&
                <TextField
                    onChange={evt => setPassword(evt.currentTarget.value)}
                    label={t("app.login.password")}
                    variant="outlined"
                    type="password"
                    autoFocus={true}
                    error={!!error}
                    helperText={error}
                    onKeyPress={(e) => {
                        if (e.key == "Enter") {
                            if (showPasswordField) {
                                doLogin();
                            }
                        }
                    }}
                />
            }

            {
                !showPasswordField &&
                <Button onClick={getProvider} variant="contained">{t("app.login.continue")}</Button>
            }

            {
                showPasswordField &&
                <Button onClick={doLogin} variant="contained">{t("app.login.log_in")}</Button>
            }
        </Stack>
    )
}

function RegisterAccountFragment(props: any) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<any>({});
    const [lastName, setLastName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const t = useTranslate();
    const { enqueueSnackbar } = useSnackbar();

    const signUp = () => {
        if (!firstName) {
            return setError({ firstName: t("app.login.errors.first_name_required") });
        }
        if (!lastName) {
            return setError({ lastName: t("app.login.errors.last_name_required") });
        }
        if (!email) {
            return setError({ email: t("app.login.errors.email_required") });
        }
        if (!password) {
            return setError({ password: t("app.login.errors.password_required") });
        }
        if (firstName && lastName && email && password) {
            firebase.auth()
                .createUserWithEmailAndPassword(email, password)
                .then(result => {
                    logger.trace("createUserWithEmailAndPassword", { result });
                    result.user?.
                        updateProfile({
                            displayName: `${firstName} ${lastName}`,
                        })
                        .then(async updateResult => {
                            logger.trace("updateProfile", { updateResult });
                        })
                        .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })));
                })
                .catch(error => setError({ password: error.message }));
        }
    }

    useEffect(() => {
        setEmail(props.email);
    }, [props, props.email]);

    return (
        <Stack spacing={1}>
            <TextField
                label={t("app.login.first_name")}
                variant="outlined"
                autoFocus={true}
                onChange={evt => setFirstName(evt.currentTarget.value)}
                error={!!error.firstName}
                helperText={error.firstName}
            />
            <TextField
                label={t("app.login.last_name")}
                variant="outlined"
                onChange={evt => setLastName(evt.currentTarget.value)}
                error={!!error.lastName}
                helperText={error.lastName}
            />
            <TextField
                error={!!error.email}
                helperText={error.email}
                onChange={evt => setEmail(evt.currentTarget.value)}
                value={props.email}
                label={t("app.login.email_address")}
                variant="outlined"
            />
            <TextField
                onChange={evt => setPassword(evt.currentTarget.value)}
                label={t("app.login.password")}
                variant="outlined"
                type="password"
                error={!!error.password}
                helperText={error.password}
            />
            <Button
                variant="contained"
                onClick={signUp}
            >
                {t("app.login.sign_up")}
            </Button>
        </Stack>
    )
}

function ForgotPasswordFragment(props: any) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const t = useTranslate();
    useEffect(() => {
        setEmail(props.email);
    }, [props, props.email]);

    const resetPassword = () => {
        firebase.auth()
            .sendPasswordResetEmail(email)
            .then(result => logger.trace("sendPasswordResetEmail", { result }))
            .catch(error => setError(error.message));
    }

    return (
        <Stack spacing={1}>
            <TextField error={!!error} helperText={error} onChange={evt => setEmail(evt.currentTarget.value)} value={props.email} label={t("app.login.email_address")} variant="outlined" />
            <Button onClick={resetPassword} variant="contained">{t("app.login.reset_password")}</Button>
        </Stack>
    )
}