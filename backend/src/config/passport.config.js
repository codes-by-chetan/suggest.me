import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import config from "./env.config.js";
import userService from "./services/user.service.js";
import ApiError from "./utils/ApiError.js";
import httpStatus from "http-status";

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userService.findUserById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: config.google.oAuth.clientId,
            clientSecret: config.google.oAuth.secret,
            callbackURL: `${config.self.host.url}/api/auth/google/callback`,
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await userService.findOneUser(profile.emails[0].value);
                if (!user) {
                    user = await userService.createUser({
                        email: profile.emails[0].value,
                        fullName: {
                            firstName: profile.name.givenName,
                            lastName: profile.name.familyName,
                        },
                        oauthProvider: "google",
                        oauthId: profile.id,
                        status: "Active",
                    });
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: config.meta.app.id,
            clientSecret: config.meta.app.secret,
            callbackURL: `${config.self.host.url}/api/auth/facebook/callback`,
            profileFields: ["id", "emails", "name"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await userService.findOneUser(profile.emails[0].value);
                if (!user) {
                    user = await userService.createUser({
                        email: profile.emails[0].value,
                        fullName: {
                            firstName: profile.name.givenName,
                            lastName: profile.name.familyName,
                        },
                        oauthProvider: "facebook",
                        oauthId: profile.id,
                        status: "Active",
                    });
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

export default passport;