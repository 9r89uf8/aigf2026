/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _utils_auth from "../_utils/auth.js";
import type * as actions_analyzeImage from "../actions/analyzeImage.js";
import type * as actions_analyzeVideo from "../actions/analyzeVideo.js";
import type * as auth from "../auth.js";
import type * as cdn from "../cdn.js";
import type * as chat from "../chat.js";
import type * as chat_actions from "../chat_actions.js";
import type * as chat_home from "../chat_home.js";
import type * as girls from "../girls.js";
import type * as http from "../http.js";
import type * as mediaInsights from "../mediaInsights.js";
import type * as payments from "../payments.js";
import type * as payments_actions from "../payments_actions.js";
import type * as profile from "../profile.js";
import type * as rekognitionClient from "../rekognitionClient.js";
import type * as s3 from "../s3.js";
import type * as turnstile from "../turnstile.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_utils/auth": typeof _utils_auth;
  "actions/analyzeImage": typeof actions_analyzeImage;
  "actions/analyzeVideo": typeof actions_analyzeVideo;
  auth: typeof auth;
  cdn: typeof cdn;
  chat: typeof chat;
  chat_actions: typeof chat_actions;
  chat_home: typeof chat_home;
  girls: typeof girls;
  http: typeof http;
  mediaInsights: typeof mediaInsights;
  payments: typeof payments;
  payments_actions: typeof payments_actions;
  profile: typeof profile;
  rekognitionClient: typeof rekognitionClient;
  s3: typeof s3;
  turnstile: typeof turnstile;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
